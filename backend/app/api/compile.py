"""POST /compile and POST /export/{pdf,png,svg}."""

import logging

from fastapi import APIRouter, HTTPException

from app.models.common import ExportFormat
from app.models.compile import (
    CompileRequest,
    CompileResponse,
    ExportRequest,
    ExportResponse,
)
from app.services import compile_service

logger = logging.getLogger("sketch2tikz.api.compile")
router = APIRouter(tags=["compile"])


@router.post("/compile", response_model=CompileResponse)
async def compile_diagram(request: CompileRequest) -> CompileResponse:
    """
    Always returns 200 with a structured CompileResponse — even for LaTeX
    validation/compilation failures — since those are expected, user-facing
    outcomes (bad generated code), not server errors. Only genuinely
    unexpected exceptions surface as 500s.
    """
    try:
        return await compile_service.compile_diagram(request)
    except Exception as exc:
        logger.exception("Unexpected error during compilation")
        raise HTTPException(status_code=500, detail="Internal error during compilation") from exc


async def _export(request: ExportRequest, expected_format: ExportFormat) -> ExportResponse:
    request.format = expected_format
    try:
        return await compile_service.export_diagram(request)
    except RuntimeError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Export to %s failed", expected_format.value)
        raise HTTPException(status_code=502, detail=f"Export to {expected_format.value} failed") from exc


@router.post("/export/pdf", response_model=ExportResponse)
async def export_pdf(request: ExportRequest) -> ExportResponse:
    return await _export(request, ExportFormat.PDF)


@router.post("/export/png", response_model=ExportResponse)
async def export_png(request: ExportRequest) -> ExportResponse:
    return await _export(request, ExportFormat.PNG)


@router.post("/export/svg", response_model=ExportResponse)
async def export_svg(request: ExportRequest) -> ExportResponse:
    return await _export(request, ExportFormat.SVG)
