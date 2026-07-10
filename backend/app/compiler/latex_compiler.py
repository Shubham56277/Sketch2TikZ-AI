"""
LaTeX compilation and format conversion.

Design notes:
- Every compile runs in a fresh, isolated temp directory that is deleted
  afterwards — no state leaks between requests, no filename collisions.
- A hard timeout is enforced on the subprocess. Generated TikZ code is
  untrusted input (it originated from an LLM prompt, ultimately from a user),
  so an infinite-loop or resource-exhausting document must not be able to
  hang or crash the container.
- `-no-shell-escape` is always passed to pdflatex. Without it, a
  maliciously-crafted LaTeX document could invoke arbitrary shell commands
  via \\write18. This is a hard security requirement, not a style choice.
- Output conversion (PDF -> PNG / SVG) shells out to poppler-utils
  (`pdftoppm`) and `pdf2svg`, which must be present in the Docker image.
"""

import asyncio
import logging
import shutil
import tempfile
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from app.config import get_settings

logger = logging.getLogger("sketch2tikz.compiler")

_DOCUMENT_TEMPLATE = r"""\documentclass[tikz,border=4pt]{{standalone}}
\usepackage{{tikz}}
\usepackage{{pgfplots}}
\pgfplotsset{{compat=1.18}}
\usetikzlibrary{{
  arrows.meta,positioning,shapes,shapes.geometric,shapes.misc,
  calc,fit,backgrounds,decorations.pathreplacing,decorations.markings,
  patterns,mindmap,trees,automata,chains
}}
\begin{{document}}
{body}
\end{{document}}
"""


@dataclass
class CompileResult:
    success: bool
    log: str
    pdf_path: Optional[Path] = None
    duration_ms: int = 0
    timed_out: bool = False


def _wrap_if_needed(code: str) -> str:
    """
    Accepts either a bare `\\begin{tikzpicture}...\\end{tikzpicture}` snippet
    (what Granite is prompted to return) or a full `\\documentclass` document
    (what a user might paste/edit manually in the code tab) and normalizes to
    a complete compilable document either way.
    """
    stripped = code.strip()
    if "\\documentclass" in stripped:
        return stripped
    return _DOCUMENT_TEMPLATE.format(body=stripped)


async def compile_tikz(code: str) -> CompileResult:
    """Compiles TikZ/LaTeX source to PDF. Returns a CompileResult; never raises for compile errors."""
    settings = get_settings()
    document = _wrap_if_needed(code)

    work_dir = Path(tempfile.mkdtemp(prefix="s2t_compile_"))
    tex_path = work_dir / "diagram.tex"
    tex_path.write_text(document, encoding="utf-8")

    start = time.monotonic()
    cmd = [
        settings.latex_engine,
        "-interaction=nonstopmode",
        "-halt-on-error",
        "-no-shell-escape",
        "-output-directory",
        str(work_dir),
        str(tex_path),
    ]

    try:
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
            cwd=str(work_dir),
        )
        try:
            stdout, _ = await asyncio.wait_for(
                process.communicate(), timeout=settings.compile_timeout_seconds
            )
        except asyncio.TimeoutError:
            process.kill()
            await process.wait()
            duration_ms = int((time.monotonic() - start) * 1000)
            logger.warning("LaTeX compile timed out after %ss", settings.compile_timeout_seconds)
            return CompileResult(
                success=False,
                log=f"Compilation timed out after {settings.compile_timeout_seconds}s.",
                duration_ms=duration_ms,
                timed_out=True,
            )

        duration_ms = int((time.monotonic() - start) * 1000)
        log = stdout.decode("utf-8", errors="replace")
        pdf_path = work_dir / "diagram.pdf"

        if process.returncode == 0 and pdf_path.exists():
            return CompileResult(success=True, log=log, pdf_path=pdf_path, duration_ms=duration_ms)

        return CompileResult(success=False, log=log, duration_ms=duration_ms)

    except FileNotFoundError:
        logger.error("LaTeX engine '%s' not found on PATH", settings.latex_engine)
        return CompileResult(
            success=False,
            log=f"LaTeX engine '{settings.latex_engine}' is not installed in this environment.",
        )


async def _run_subprocess(cmd: list[str], timeout: int) -> tuple[int, str]:
    process = await asyncio.create_subprocess_exec(
        *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.STDOUT
    )
    try:
        stdout, _ = await asyncio.wait_for(process.communicate(), timeout=timeout)
    except asyncio.TimeoutError:
        process.kill()
        await process.wait()
        return -1, "conversion timed out"
    return process.returncode, stdout.decode("utf-8", errors="replace")


async def pdf_to_png(pdf_path: Path, dpi: int = 200) -> Path:
    """Converts the first page of a PDF to PNG using poppler-utils' pdftoppm."""
    settings = get_settings()
    out_prefix = pdf_path.with_suffix("")
    cmd = ["pdftoppm", "-png", "-r", str(dpi), "-singlefile", str(pdf_path), str(out_prefix)]
    returncode, log = await _run_subprocess(cmd, settings.compile_timeout_seconds)
    png_path = out_prefix.with_suffix(".png")
    if returncode != 0 or not png_path.exists():
        raise RuntimeError(f"PNG conversion failed: {log}")
    return png_path


async def pdf_to_svg(pdf_path: Path) -> Path:
    """Converts the first page of a PDF to SVG using pdf2svg."""
    settings = get_settings()
    svg_path = pdf_path.with_suffix(".svg")
    cmd = ["pdf2svg", str(pdf_path), str(svg_path), "1"]
    returncode, log = await _run_subprocess(cmd, settings.compile_timeout_seconds)
    if returncode != 0 or not svg_path.exists():
        raise RuntimeError(f"SVG conversion failed: {log}")
    return svg_path


def cleanup_workdir(pdf_path: Path) -> None:
    """Removes the temp directory a CompileResult's pdf_path lives in."""
    try:
        shutil.rmtree(pdf_path.parent, ignore_errors=True)
    except Exception:
        logger.warning("Failed to clean up compile workdir: %s", pdf_path.parent)
