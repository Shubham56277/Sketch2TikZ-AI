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
import re
import shutil
import tempfile
import time
from dataclasses import dataclass, field
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

_DIAGRAM_ENVIRONMENTS = ("tikzpicture", "axis")
_FORBIDDEN_SUBSTRINGS = ("```", "<html", "<body", "<div", "<script", "<!DOCTYPE", '"%>', '">%')
_HTML_CONTAMINATION_RE = re.compile(
    r"</?[a-zA-Z][^<>]*>|&(?:gt|lt|quot|amp);|\"\s*>|>\s*%",
    re.IGNORECASE,
)


@dataclass
class CompileResult:
    success: bool
    log: str
    pdf_path: Optional[Path] = None
    duration_ms: int = 0
    timed_out: bool = False
    stage: str = "latex_compile"

    @property
    def first_error(self) -> Optional[str]:
        """Best-effort extraction of the first actionable error line from the log."""
        return extract_first_error(self.log)


def extract_first_error(log: str) -> Optional[str]:
    """
    pdflatex logs are verbose; the actionable error is almost always the
    first line starting with '!' (LaTeX's own error marker), or the first
    line of our own "Validation failed:" block.
    """
    if log.startswith("Validation failed:"):
        lines = log.splitlines()
        return lines[1] if len(lines) > 1 else lines[0]
    for line in log.splitlines():
        if line.startswith("!"):
            return line.strip()
    return None


@dataclass
class ValidationResult:
    valid: bool
    errors: list[str] = field(default_factory=list)


def normalize_document(code: str) -> str:
    """
    Accepts either a bare `\\begin{tikzpicture}...\\end{tikzpicture}` snippet
    (what Granite is prompted to return) or a full `\\documentclass` document
    (what a user might paste/edit manually in the code tab) and normalizes to
    a single, complete, compilable document either way.

    Unlike a naive wrap, this repairs partial documents:
    - If \\documentclass is present but \\begin{document} is missing, it is
      inserted right after the preamble (before the first diagram
      environment).
    - If \\begin{document} is present but \\end{document} is missing, it is
      appended.
    - Never produces duplicate \\documentclass / \\begin{document} /
      \\end{document} statements.
    """
    stripped = code.strip()

    if "\\documentclass" not in stripped:
        return _DOCUMENT_TEMPLATE.format(body=stripped)

    has_begin_document = "\\begin{document}" in stripped
    has_end_document = "\\end{document}" in stripped

    if not has_begin_document:
        # Insert \begin{document} right before the first diagram environment,
        # which marks the end of the preamble in practice.
        insertion_point = None
        for env in _DIAGRAM_ENVIRONMENTS:
            match = re.search(rf"\\begin\{{{env}\}}", stripped)
            if match and (insertion_point is None or match.start() < insertion_point):
                insertion_point = match.start()
        if insertion_point is not None:
            stripped = stripped[:insertion_point] + "\\begin{document}\n" + stripped[insertion_point:]
        else:
            stripped += "\n\\begin{document}\n"

    if not has_end_document:
        stripped += "\n\\end{document}\n"

    return stripped


def validate_document(document: str) -> ValidationResult:
    """
    Structural validation run before ever invoking pdflatex. Catches the
    classes of malformed output observed from LLM generation (missing
    closers, unbalanced braces/environments, leaked Markdown/HTML) with a
    clear, specific error instead of letting pdflatex fail cryptically.
    """
    errors: list[str] = []

    documentclass_count = len(re.findall(r"\\documentclass", document))
    if documentclass_count == 0:
        errors.append("Missing \\documentclass.")
    elif documentclass_count > 1:
        errors.append(f"Found {documentclass_count} \\documentclass declarations; expected exactly 1.")

    if "\\begin{document}" not in document:
        errors.append("Missing \\begin{document}.")
    if "\\end{document}" not in document:
        errors.append("Missing \\end{document}.")

    if document.count("{") != document.count("}"):
        errors.append(
            f"Unbalanced braces: {document.count('{')} opening '{{' vs {document.count('}')} closing '}}'."
        )

    begins = re.findall(r"\\begin\{([a-zA-Z*]+)\}", document)
    ends = re.findall(r"\\end\{([a-zA-Z*]+)\}", document)
    begin_counts: dict[str, int] = {}
    for name in begins:
        begin_counts[name] = begin_counts.get(name, 0) + 1
    end_counts: dict[str, int] = {}
    for name in ends:
        end_counts[name] = end_counts.get(name, 0) + 1
    for name, count in begin_counts.items():
        if end_counts.get(name, 0) != count:
            errors.append(
                f"Unbalanced environment '{name}': {count} \\begin vs {end_counts.get(name, 0)} \\end."
            )
    for name, count in end_counts.items():
        if name not in begin_counts:
            errors.append(f"\\end{{{name}}} has no matching \\begin{{{name}}}.")

    if not any(env in begin_counts for env in _DIAGRAM_ENVIRONMENTS):
        errors.append(
            f"No supported diagram environment found (expected one of: {', '.join(_DIAGRAM_ENVIRONMENTS)})."
        )

    for forbidden in _FORBIDDEN_SUBSTRINGS:
        if forbidden.lower() in document.lower():
            errors.append(f"Document contains disallowed content: {forbidden!r}.")

    if _HTML_CONTAMINATION_RE.search(document):
        errors.append("Document contains obvious HTML/model-output contamination.")

    return ValidationResult(valid=len(errors) == 0, errors=errors)


async def compile_tikz(code: str) -> CompileResult:
    """
    Compiles TikZ/LaTeX source to PDF. Never raises for compile OR validation
    errors — both are reported via CompileResult.success=False with the
    reason in .log, so callers have one consistent failure path.
    """
    settings = get_settings()
    document = normalize_document(code)

    validation = validate_document(document)
    if not validation.valid:
        logger.warning("Document failed structural validation: %s", validation.errors)
        return CompileResult(
            success=False,
            log="Validation failed:\n" + "\n".join(validation.errors),
            stage="validation",
        )

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
        # The subprocess already runs with cwd=work_dir.  Passing only the
        # filename avoids MiKTeX incorrectly splitting absolute Windows
        # paths when the user's profile directory contains a space.
        tex_path.name,
    ]
    logger.info("Compiling with command: %s", " ".join(cmd))

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
            shutil.rmtree(work_dir, ignore_errors=True)
            return CompileResult(
                success=False,
                log=f"Compilation timed out after {settings.compile_timeout_seconds}s.",
                duration_ms=duration_ms,
                timed_out=True,
            )

        duration_ms = int((time.monotonic() - start) * 1000)
        log = stdout.decode("utf-8", errors="replace")
        pdf_path = work_dir / "diagram.pdf"
        logger.info("Compile finished in %dms (returncode=%s)", duration_ms, process.returncode)

        if process.returncode == 0 and pdf_path.exists():
            return CompileResult(success=True, log=log, pdf_path=pdf_path, duration_ms=duration_ms)

        first_error = extract_first_error(log)
        if first_error:
            logger.warning("First LaTeX error: %s", first_error)
        shutil.rmtree(work_dir, ignore_errors=True)
        return CompileResult(success=False, log=log, duration_ms=duration_ms)

    except FileNotFoundError:
        logger.error("LaTeX engine '%s' not found on PATH", settings.latex_engine)
        shutil.rmtree(work_dir, ignore_errors=True)
        return CompileResult(
            success=False,
            log=f"LaTeX engine '{settings.latex_engine}' is not installed in this environment.",
            stage="environment",
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
