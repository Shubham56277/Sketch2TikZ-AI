"""
Orchestrates prompt -> Granite -> parsed TikZ, and the autofix retry loop.

This service intentionally does NOT compile the diagram itself for /generate
— that is left to the /compile endpoint and the frontend's own "Compile"
button, matching the existing workspace.tsx UI which has separate Generate
and Compile actions. /autofix, however, DOES compile internally, since its
entire purpose is "keep retrying until it compiles or attempts run out".
"""

import logging

from app.agents import prompts, watsonx_client
from app.agents.response_parser import parse_model_response
from app.compiler.latex_compiler import (
    cleanup_workdir,
    compile_tikz,
    normalize_document,
    validate_document,
)
from app.config import get_settings
from app.models.common import CompileStatus
from app.models.generate import (
    AutofixRequest,
    AutofixResponse,
    ChatTurn,
    GenerateRequest,
    GenerateResponse,
)

logger = logging.getLogger("sketch2tikz.generation")


class GenerationValidationError(ValueError):
    """Raised when Granite's output fails structural validation even after sanitization."""

    def __init__(self, errors: list[str], code: str):
        self.errors = errors
        self.code = code
        super().__init__("; ".join(errors))


def _format_history(history: list[ChatTurn]) -> str:
    if not history:
        return ""
    lines = [f"{turn.role}: {turn.content}" for turn in history[-6:]]  # cap context size
    return "\n".join(lines)


async def generate_diagram(request: GenerateRequest) -> GenerateResponse:
    settings = get_settings()
    user_prompt = prompts.build_generate_user_prompt(
        prompt=request.prompt,
        existing_code=request.existing_code,
        history_text=_format_history(request.history),
    )

    logger.info("generate: model=%s diagram_type=%s", settings.watsonx_text_model_id, request.diagram_type)
    parsed = None
    validation = None
    for attempt in range(1, settings.autofix_max_attempts + 1):
        attempt_prompt = user_prompt
        if attempt > 1:
            attempt_prompt += (
                "\n\nYour previous response was not a usable TikZ diagram. "
                "Do not refuse or explain. Return a concrete diagram containing "
                "\\node and \\draw commands in the required tagged format."
            )
        raw = await watsonx_client.generate_text(prompts.TIKZ_SYSTEM_PROMPT, attempt_prompt)
        parsed = parse_model_response(raw)
        logger.info("generate: attempt=%d sanitized code length=%d chars", attempt, len(parsed.code))
        validation = validate_document(normalize_document(parsed.code))
        if validation.valid:
            break
        logger.warning("generate: attempt=%d failed validation: %s", attempt, validation.errors)

    assert parsed is not None and validation is not None
    if not validation.valid:
        raise GenerationValidationError(validation.errors, parsed.code)

    return GenerateResponse(
        code=parsed.code,
        explanation=parsed.explanation,
        diagram_type=request.diagram_type,
        model_id=settings.watsonx_text_model_id,
        validation_errors=None,
    )


async def autofix_diagram(request: AutofixRequest) -> AutofixResponse:
    """
    Repeatedly asks Granite to fix the code and recompiles, up to
    AUTOFIX_MAX_ATTEMPTS times. Stops early as soon as a compile succeeds.
    """
    settings = get_settings()
    current_code = request.code
    current_log = request.error_log
    explanation = ""
    attempts = 0
    compile_status = CompileStatus.FAILED

    for attempt in range(1, settings.autofix_max_attempts + 1):
        attempts = attempt
        logger.info("autofix: attempt %d/%d", attempt, settings.autofix_max_attempts)
        user_prompt = prompts.build_autofix_user_prompt(current_code, current_log)
        raw = await watsonx_client.generate_text(prompts.AUTOFIX_SYSTEM_PROMPT, user_prompt)
        parsed = parse_model_response(raw)
        current_code = parsed.code
        explanation = parsed.explanation

        result = await compile_tikz(current_code)
        try:
            if result.success:
                compile_status = CompileStatus.SUCCESS
                logger.info("autofix: succeeded on attempt %d", attempt)
                return AutofixResponse(
                    code=current_code,
                    explanation=explanation,
                    fixed=True,
                    attempts=attempts,
                    compile_status=compile_status,
                    compile_log=result.log,
                )
            current_log = result.log
            compile_status = CompileStatus.TIMEOUT if result.timed_out else CompileStatus.FAILED
            logger.warning(
                "autofix: attempt %d failed (stage=%s, first_error=%s)",
                attempt,
                result.stage,
                result.first_error,
            )
        finally:
            if result.pdf_path:
                cleanup_workdir(result.pdf_path)

    logger.info("Autofix exhausted %d attempts without a successful compile", attempts)
    return AutofixResponse(
        code=current_code,
        explanation=explanation,
        fixed=False,
        attempts=attempts,
        compile_status=compile_status,
        compile_log=current_log,
    )
