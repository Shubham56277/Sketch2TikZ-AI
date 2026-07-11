"""Orchestrates LaTeX compilation and PDF/PNG/SVG export, including COS upload."""

import logging
from pathlib import Path
from typing import Optional

from app.compiler.latex_compiler import cleanup_workdir, compile_tikz, pdf_to_png, pdf_to_svg
from app.models.common import CompileStatus, ExportFormat
from app.models.compile import CompileRequest, CompileResponse, ExportRequest, ExportResponse
from app.storage import cos_client, local_asset_store

logger = logging.getLogger("sketch2tikz.compile_service")

_CONTENT_TYPES = {
    ExportFormat.PDF: "application/pdf",
    ExportFormat.PNG: "image/png",
    ExportFormat.SVG: "image/svg+xml",
    ExportFormat.TEX: "text/x-tex",
}


async def compile_diagram(request: CompileRequest) -> CompileResponse:
    """
    Compilation and storage are treated as separate stages. A LaTeX
    compilation that succeeds but fails to upload to Object Storage is
    reported as status=SUCCESS with a populated storage_error — it must
    never be reported as a compile failure, since the diagram itself is
    valid and the user's next retry of the *same* code would compile fine
    again (the problem is transient/infra, not the generated LaTeX).
    """
    result = await compile_tikz(request.code)
    try:
        if not result.success:
            status = CompileStatus.TIMEOUT if result.timed_out else CompileStatus.FAILED
            logger.warning(
                "compile: failed (stage=%s, first_error=%s)", result.stage, result.first_error
            )
            return CompileResponse(
                status=status,
                log=result.log,
                duration_ms=result.duration_ms,
                first_error=result.first_error,
            )

        pdf_url = None
        storage_error = None
        pdf_bytes = result.pdf_path.read_bytes() if result.pdf_path else None
        if pdf_bytes is not None and cos_client.is_configured():
            try:
                key = cos_client.build_key("diagram.pdf", project_id=request.project_id)
                pdf_url = cos_client.upload_bytes(pdf_bytes, key, _CONTENT_TYPES[ExportFormat.PDF])
                logger.info("compile: uploaded PDF to COS key=%s", key)
            except Exception as exc:
                logger.exception("compile: COS upload failed after successful compilation")
                storage_error = f"Compiled successfully, but saving the PDF failed: {exc}"
        elif pdf_bytes is not None and not cos_client.is_configured():
            storage_error = "Compiled successfully, but Object Storage is not configured — PDF was not saved."

        if pdf_url is None and pdf_bytes is not None:
            pdf_url = local_asset_store.put(pdf_bytes, _CONTENT_TYPES[ExportFormat.PDF])
            logger.warning("compile: using temporary local preview fallback")

        logger.info(
            "compile: success duration_ms=%s storage_error=%s", result.duration_ms, bool(storage_error)
        )
        return CompileResponse(
            status=CompileStatus.SUCCESS,
            log=result.log,
            pdf_url=pdf_url,
            duration_ms=result.duration_ms,
            storage_error=storage_error,
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
            logger.warning("export: compilation stage failed (stage=%s)", result.stage)
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
        try:
            url = cos_client.upload_bytes(data, key, _CONTENT_TYPES[request.format])
        except Exception as exc:
            logger.exception("export: COS upload failed after successful compilation/conversion")
            raise RuntimeError(f"Compiled successfully, but storage upload failed: {exc}") from exc
        logger.info("export: uploaded %s to COS key=%s", request.format.value, key)
        return ExportResponse(format=request.format, url=url, duration_ms=result.duration_ms)
    finally:
        if result.pdf_path:
            cleanup_workdir(result.pdf_path)
