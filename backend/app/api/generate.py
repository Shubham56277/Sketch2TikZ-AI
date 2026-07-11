"""POST /generate and POST /autofix."""

import logging

from fastapi import APIRouter, HTTPException

from app.models.generate import (
    AutofixRequest,
    AutofixResponse,
    GenerateRequest,
    GenerateResponse,
)
from app.services import generation_service

logger = logging.getLogger("sketch2tikz.api.generate")
router = APIRouter(tags=["generate"])


@router.post("/generate", response_model=GenerateResponse)
async def generate(request: GenerateRequest) -> GenerateResponse:
    try:
        return await generation_service.generate_diagram(request)
    except generation_service.GenerationValidationError as exc:
        logger.warning("Granite returned unusable diagram output: %s", exc)
        raise HTTPException(
            status_code=422,
            detail="The AI did not return a usable TikZ diagram after retrying. Please try again.",
        ) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Generation failed")
        raise HTTPException(status_code=502, detail="Diagram generation failed") from exc


@router.post("/autofix", response_model=AutofixResponse)
async def autofix(request: AutofixRequest) -> AutofixResponse:
    try:
        return await generation_service.autofix_diagram(request)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Autofix failed")
        raise HTTPException(status_code=502, detail="Autofix failed") from exc
