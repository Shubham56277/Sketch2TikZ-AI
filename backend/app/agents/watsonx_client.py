"""
IBM watsonx.ai integration.

This module is the only place where ibm_watsonx_ai is imported.
All blocking SDK calls are executed in worker threads so they do not block
FastAPI's asyncio event loop.
"""

import base64
import logging
from typing import Optional

import anyio
from ibm_watsonx_ai import Credentials
from ibm_watsonx_ai.foundation_models import ModelInference

from app.config import get_settings

logger = logging.getLogger("sketch2tikz.watsonx")

_text_model: Optional[ModelInference] = None
_vision_model: Optional[ModelInference] = None

_GENERATE_PARAMS = {
    "decoding_method": "greedy",
    "max_new_tokens": 3000,
    "min_new_tokens": 1,
    "repetition_penalty": 1.05,
}


def is_configured() -> bool:
    """Check whether the required watsonx.ai settings are available."""
    settings = get_settings()

    return bool(
        settings.watsonx_api_key
        and settings.watsonx_project_id
        and settings.watsonx_url
        and settings.watsonx_text_model_id
    )


def _get_credentials() -> Credentials:
    """Create IBM watsonx.ai credentials."""
    settings = get_settings()

    return Credentials(
        url=settings.watsonx_url.strip(),
        api_key=settings.watsonx_api_key.strip(),
    )


def _get_text_model() -> ModelInference:
    """Create and cache the text-generation model."""
    global _text_model

    if _text_model is None:
        settings = get_settings()

        logger.info(
            "Initializing watsonx text model: %s",
            settings.watsonx_text_model_id,
        )

        _text_model = ModelInference(
            model_id=settings.watsonx_text_model_id.strip(),
            credentials=_get_credentials(),
            project_id=settings.watsonx_project_id.strip(),
        )

    return _text_model


def _get_vision_model() -> ModelInference:
    """Create and cache the vision-capable model."""
    global _vision_model

    if _vision_model is None:
        settings = get_settings()

        if not settings.watsonx_vision_model_id:
            raise RuntimeError(
                "WATSONX_VISION_MODEL_ID is not configured."
            )

        logger.info(
            "Initializing watsonx vision model: %s",
            settings.watsonx_vision_model_id,
        )

        _vision_model = ModelInference(
            model_id=settings.watsonx_vision_model_id.strip(),
            credentials=_get_credentials(),
            project_id=settings.watsonx_project_id.strip(),
        )

    return _vision_model


def _generate_text_sync(
    system_prompt: str,
    user_prompt: str,
) -> str:
    """
    Generate text synchronously using the configured Granite model.

    `system_prompt` (from app.agents.prompts) is the single source of truth
    for output-format instructions (delimited <TIKZ>/<EXPLANATION> tags, no
    Markdown fences, no prose, etc). We deliberately do NOT wrap it in a
    second, different instruction template here — doing so previously caused
    the model to receive conflicting/duplicated instructions, which
    correlated with malformed output (stray HTML fragments, missing
    \\end{document}). Keep this function a thin, faithful pass-through.
    """
    settings = get_settings()
    model = _get_text_model()

    prompt = f"<|system|>\n{system_prompt}\n<|user|>\n{user_prompt}\n<|assistant|>\n"

    logger.info(
        "Generating with model=%s prompt_chars=%d",
        settings.watsonx_text_model_id,
        len(prompt),
    )

    response = model.generate_text(
        prompt=prompt,
        params=_GENERATE_PARAMS,
    )

    if not response:
        raise RuntimeError(
            "watsonx.ai returned an empty response."
        )

    raw = str(response).strip()
    logger.info("Received raw model response: %d chars", len(raw))
    return raw


def _generate_vision_sync(
    system_prompt: str,
    user_text: str,
    image_bytes: bytes,
    mime_type: str,
) -> str:
    """Generate TikZ from an uploaded image synchronously."""
    model = _get_vision_model()

    encoded_image = base64.b64encode(
        image_bytes
    ).decode("utf-8")

    messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": (
                        f"{system_prompt}\n\n"
                        f"{user_text}\n\n"
                        "Return only valid, complete, compilable "
                        "LaTeX or TikZ code without Markdown fences."
                    ),
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": (
                            f"data:{mime_type};"
                            f"base64,{encoded_image}"
                        )
                    },
                },
            ],
        }
    ]

    response = model.chat(messages=messages)

    try:
        content = response["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        logger.exception(
            "Unexpected watsonx vision response format"
        )
        raise RuntimeError(
            "watsonx.ai returned an invalid vision response."
        ) from exc

    if not content:
        raise RuntimeError(
            "watsonx.ai returned an empty vision response."
        )

    return str(content).strip()


async def generate_text(
    system_prompt: str,
    user_prompt: str,
) -> str:
    """Run text generation without blocking FastAPI."""
    if not is_configured():
        raise RuntimeError(
            "watsonx.ai is not configured. Check "
            "WATSONX_API_KEY, WATSONX_PROJECT_ID, "
            "WATSONX_URL, and WATSONX_TEXT_MODEL_ID."
        )

    logger.info("Calling watsonx text model")

    try:
        return await anyio.to_thread.run_sync(
            _generate_text_sync,
            system_prompt,
            user_prompt,
        )
    except Exception:
        logger.exception(
            "watsonx text generation failed"
        )
        raise


async def generate_from_image(
    system_prompt: str,
    user_text: str,
    image_bytes: bytes,
    mime_type: str,
) -> str:
    """Run vision generation without blocking FastAPI."""
    if not is_configured():
        raise RuntimeError(
            "watsonx.ai is not configured. Check the "
            "required environment variables."
        )

    logger.info("Calling watsonx vision model")

    try:
        return await anyio.to_thread.run_sync(
            _generate_vision_sync,
            system_prompt,
            user_text,
            image_bytes,
            mime_type,
        )
    except Exception:
        logger.exception(
            "watsonx vision generation failed"
        )
        raise