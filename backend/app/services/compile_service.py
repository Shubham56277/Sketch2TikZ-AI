"""Orchestrates LaTeX compilation and PDF/PNG/SVG export, including COS upload."""

import logging
from pathlib import Path
from typing import Optional

from app.compiler.latex_compiler import cleanup_workdir, compile_tikz, pdf_to_png, pdf_to_svg
from app.models.common import CompileStatus, ExportFormat
from app.models.compile import CompileRequest, CompileResponse, ExportRequest, ExportResponse
from app.storage import cos_client

logger = logging.getLogger("sketch2tikz.compile_service")

_CONTENT_TYPES = {
    ExportFormat.PDF: "application/pdf",
    ExportFormat.PNG: "image/png",
    ExportFormat.SVG: "image/svg+xml",
    ExportFormat.TEX: "text/x-tex",
}


async def compile_diagram(request: CompileRequest) -> CompileResponse:
    result = await compile_tikz(request.code)
    try:
        if not result.success:
            status = CompileStatus.TIMEOUT if result.timed_out else CompileStatus.FAILED
            return CompileResponse(status=status, log=result.log, duration_ms=result.duration_ms)

        pdf_url = None
        if result.pdf_path and cos_client.is_configured():
            pdf_bytes = result.pdf_path.read_bytes()
            key = cos_client.build_key("diagram.pdf", project_id=request.project_id)
            pdf_url = cos_client.upload_bytes(pdf_bytes, key, _CONTENT_TYPES[ExportFormat.PDF])

        return CompileResponse(
            status=CompileStatus.SUCCESS,
            log=result.log,
            pdf_url=pdf_url,
            duration_ms=result.duration_ms,
        )
    finally:
        if result.pdf_path:
            cleanup_workdir(result.pdf_path)


async def export_diagram(request: ExportRequest) -> ExportResponse:
    """
    Compiles the given code, converts to the requested format, uploads to
    COS, and returns the resulting asset URL. TEX export skips compilation
    entirely since it's just the raw source.
    """
    if request.format == ExportFormat.TEX:
        key = cos_client.build_key("diagram.tex", project_id=request.project_id)
        url = cos_client.upload_bytes(
            request.code.encode("utf-8"), key, _CONTENT_TYPES[ExportFormat.TEX]
        )
        return ExportResponse(format=request.format, url=url, duration_ms=0)

    result = await compile_tikz(request.code)
    try:
        if not result.success or not result.pdf_path:
            raise RuntimeError(f"Cannot export — compilation failed:\n{result.log}")

        output_path: Optional[Path] = None
        if request.format == ExportFormat.PDF:
            output_path = result.pdf_path
        elif request.format == ExportFormat.PNG:
            output_path = await pdf_to_png(result.pdf_path)
        elif request.format == ExportFormat.SVG:
            output_path = await pdf_to_svg(result.pdf_path)

        assert output_path is not None
        data = output_path.read_bytes()
        key = cos_client.build_key(output_path.name, project_id=request.project_id)
        url = cos_client.upload_bytes(data, key, _CONTENT_TYPES[request.format])
        return ExportResponse(format=request.format, url=url, duration_ms=result.duration_ms)
    finally:
        if result.pdf_path:
            cleanup_workdir(result.pdf_path)
