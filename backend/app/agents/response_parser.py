"""
Parses and sanitizes Granite's raw output into usable TikZ/LaTeX source.

Granite (like most LLMs) does not reliably follow the requested <TIKZ>/
<EXPLANATION> tag format under all conditions. Observed failure modes include:
- Markdown code fences (```latex ... ``` or ```tex ... ```)
- Explanatory prose before or after the code
- Stray HTML/XML fragments bleeding into the output (e.g. a trailing `">` from
  a malformed label attribute the model hallucinated)
- Null bytes / control characters
- Incomplete documents (missing \\end{document}, unbalanced braces)

`sanitize_latex()` is a defensive cleanup pass applied to whatever text we
eventually decide is "the code" (whether extracted from <TIKZ> tags, a
markdown fence, or used as a raw fallback). It only strips content that is
clearly not valid LaTeX (fences, control chars, HTML-tag-like fragments,
leading/trailing prose outside the code) — it never touches valid LaTeX
commands, braces, or special characters.
"""

import logging
import re
from dataclasses import dataclass

logger = logging.getLogger("sketch2tikz.response_parser")

_TIKZ_RE = re.compile(r"<TIKZ>\s*(.*?)\s*</TIKZ>", re.DOTALL | re.IGNORECASE)
_EXPLANATION_RE = re.compile(r"<EXPLANATION>\s*(.*?)\s*</EXPLANATION>", re.DOTALL | re.IGNORECASE)
_CODE_FENCE_RE = re.compile(r"```(?:latex|tex)?\s*(.*?)```", re.DOTALL | re.IGNORECASE)

# Matches a LaTeX "anchor" command we can trust as the real start of the
# document — anything before the first anchor is assumed to be prose/
# preamble noise the model added despite instructions not to.
_START_ANCHOR_RE = re.compile(r"\\(documentclass|begin\{tikzpicture\}|begin\{axis\})")

# A stray HTML/XML-like fragment such as `">`, `</div>`, `<br/>` etc. These
# are never valid inside a TikZ/LaTeX body and indicate model contamination
# (e.g. leaked markup from a `label={...}` the model tried to write in an
# HTML-attribute style, or copy-paste bleed from training data).
_HTML_FRAGMENT_RE = re.compile(
    r"</?[a-zA-Z][a-zA-Z0-9]*(?:\s+[^<>]*)?/?>|\"\s*>|&(?:gt|lt|quot);",
    re.IGNORECASE,
)

_CONTROL_CHAR_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


@dataclass
class ParsedGeneration:
    code: str
    explanation: str


def sanitize_latex(text: str) -> str:
    """
    Cleans raw model output that is expected to be a LaTeX/TikZ fragment or
    document. Safe to call on already-clean input (idempotent).

    Steps, in order:
    1. Normalize line endings (CRLF/CR -> LF).
    2. Strip null bytes and other non-printable control characters.
    3. Remove markdown code fences, keeping their contents.
    4. Trim everything before the first recognizable LaTeX anchor
       (\\documentclass or \\begin{tikzpicture}/\\begin{axis}), since Granite
       sometimes prepends a sentence of prose despite instructions not to.
    5. Trim trailing prose after the last \\end{...} on the final line-ish
       boundary, and strip stray HTML/XML fragments anywhere in the text.
    6. Collapse to a single trailing newline and strip outer whitespace.
    """
    if not text:
        return text

    cleaned = text.replace("\r\n", "\n").replace("\r", "\n")
    cleaned = _CONTROL_CHAR_RE.sub("", cleaned)

    fence_match = _CODE_FENCE_RE.search(cleaned)
    if fence_match:
        cleaned = fence_match.group(1)
    else:
        # No fence, but the model may still have used bare ``` markers
        # inconsistently (e.g. only an opening fence). Strip stray fence
        # markers so they never reach pdflatex as literal text.
        cleaned = cleaned.replace("```latex", "").replace("```tex", "").replace("```", "")

    start_match = _START_ANCHOR_RE.search(cleaned)
    if start_match:
        discarded = cleaned[: start_match.start()].strip()
        if discarded:
            logger.info("Sanitizer discarded %d chars of leading prose", len(discarded))
        cleaned = cleaned[start_match.start() :]

    # Strip stray HTML/XML-like fragments (e.g. the `">` contamination seen
    # in production). This is intentionally narrow: it only matches
    # tag-shaped substrings, never bare braces or backslash commands, so
    # valid LaTeX such as \node[label={below:X}] is left untouched.
    html_matches = _HTML_FRAGMENT_RE.findall(cleaned)
    if html_matches:
        logger.warning("Sanitizer stripped %d HTML-like fragment(s): %r", len(html_matches), html_matches[:5])
        cleaned = _HTML_FRAGMENT_RE.sub("", cleaned)

    # Trim trailing prose: if there's an \end{...} present, drop anything
    # after the LAST closing environment tag that isn't itself LaTeX (a
    # model that appends "I hope this helps!" after the code is common).
    last_end_positions = [m.end() for m in re.finditer(r"\\end\{[a-zA-Z*]+\}", cleaned)]
    if last_end_positions:
        tail = cleaned[last_end_positions[-1] :]
        # Only trim the tail if it doesn't itself contain further LaTeX
        # commands (a legitimate multi-environment document would have
        # more \end{...} occurrences already captured above).
        if "\\" not in tail:
            cleaned = cleaned[: last_end_positions[-1]]

    return cleaned.strip() + "\n"


def parse_model_response(raw_text: str) -> ParsedGeneration:
    """
    Extracts code and explanation from the model's raw output.
    1. Try <TIKZ>/<EXPLANATION> tags (the primary, prompted format) — the
       extracted code is still run through sanitize_latex() since a model
       can wrap contaminated content inside otherwise-correct tags.
    2. Fall back to a markdown code fence if present.
    3. Fall back to the sanitized raw text as code with an empty
       explanation, so the caller always gets *something* usable rather
       than raising.
    """
    logger.info("Parsing model response (%d chars)", len(raw_text))

    tikz_match = _TIKZ_RE.search(raw_text)
    explanation_match = _EXPLANATION_RE.search(raw_text)

    if tikz_match:
        code = sanitize_latex(tikz_match.group(1))
        explanation = explanation_match.group(1).strip() if explanation_match else ""
        explanation = _CONTROL_CHAR_RE.sub("", explanation)
        return ParsedGeneration(code=_ensure_tikzpicture(code), explanation=explanation)

    fence_match = _CODE_FENCE_RE.search(raw_text)
    if fence_match:
        return ParsedGeneration(code=_ensure_tikzpicture(sanitize_latex(fence_match.group(1))), explanation="")

    logger.warning("Model response did not contain <TIKZ> tags or a code fence; using sanitized raw fallback")
    return ParsedGeneration(code=_ensure_tikzpicture(sanitize_latex(raw_text)), explanation="")


def _ensure_tikzpicture(code: str) -> str:
    """Defensive guard: if the model omitted the tikzpicture wrapper entirely, add it."""
    stripped = code.strip()
    if "\\begin{tikzpicture}" in stripped or "\\documentclass" in stripped:
        return stripped
    return f"\\begin{{tikzpicture}}\n{stripped}\n\\end{{tikzpicture}}"
