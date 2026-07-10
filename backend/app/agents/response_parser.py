"""Parses the <TIKZ>/<EXPLANATION> delimited format Granite is prompted to produce."""

import re
from dataclasses import dataclass

_TIKZ_RE = re.compile(r"<TIKZ>\s*(.*?)\s*</TIKZ>", re.DOTALL | re.IGNORECASE)
_EXPLANATION_RE = re.compile(r"<EXPLANATION>\s*(.*?)\s*</EXPLANATION>", re.DOTALL | re.IGNORECASE)
_CODE_FENCE_RE = re.compile(r"```(?:latex|tex)?\s*(.*?)```", re.DOTALL | re.IGNORECASE)


@dataclass
class ParsedGeneration:
    code: str
    explanation: str


def parse_model_response(raw_text: str) -> ParsedGeneration:
    """
    Extracts code and explanation from the model's raw output. Falls back
    gracefully if the model didn't follow the exact tag format:
    1. Try <TIKZ>/<EXPLANATION> tags (the primary, prompted format).
    2. Fall back to a markdown code fence if present.
    3. Fall back to the raw text as code with an empty explanation, so the
       caller always gets *something* usable rather than raising.
    """
    tikz_match = _TIKZ_RE.search(raw_text)
    explanation_match = _EXPLANATION_RE.search(raw_text)

    if tikz_match:
        code = tikz_match.group(1).strip()
        explanation = explanation_match.group(1).strip() if explanation_match else ""
        return ParsedGeneration(code=_ensure_tikzpicture(code), explanation=explanation)

    fence_match = _CODE_FENCE_RE.search(raw_text)
    if fence_match:
        return ParsedGeneration(code=_ensure_tikzpicture(fence_match.group(1).strip()), explanation="")

    return ParsedGeneration(code=_ensure_tikzpicture(raw_text.strip()), explanation="")


def _ensure_tikzpicture(code: str) -> str:
    """Defensive guard: if the model omitted the tikzpicture wrapper entirely, add it."""
    if "\\begin{tikzpicture}" in code or "\\documentclass" in code:
        return code
    return f"\\begin{{tikzpicture}}\n{code}\n\\end{{tikzpicture}}"
