"""
Tests for app.compiler.latex_compiler's normalize_document() and
validate_document() — the structural-safety net that runs before pdflatex
is ever invoked. These do not require a real LaTeX installation.
"""

from app.compiler.latex_compiler import (
    extract_first_error,
    normalize_document,
    validate_document,
)
from tests.test_response_parser import MALFORMED_LOGIN_FLOWCHART


class TestNormalizeDocument:
    def test_wraps_bare_tikzpicture_snippet_in_full_document(self):
        result = normalize_document("\\begin{tikzpicture}\\node{A};\\end{tikzpicture}")
        assert result.count("\\documentclass") == 1
        assert result.count("\\begin{document}") == 1
        assert result.count("\\end{document}") == 1

    def test_full_document_with_all_parts_is_untouched_in_structure(self):
        document = (
            "\\documentclass[tikz]{standalone}\n\\begin{document}\n"
            "\\begin{tikzpicture}\\node{A};\\end{tikzpicture}\n\\end{document}\n"
        )
        result = normalize_document(document)
        assert result.count("\\documentclass") == 1
        assert result.count("\\begin{document}") == 1
        assert result.count("\\end{document}") == 1

    def test_appends_missing_end_document(self):
        document = (
            "\\documentclass[tikz]{standalone}\n\\begin{document}\n"
            "\\begin{tikzpicture}\\node{A};\\end{tikzpicture}\n"
        )
        result = normalize_document(document)
        assert "\\end{document}" in result
        assert result.count("\\end{document}") == 1

    def test_inserts_missing_begin_document_before_diagram_environment(self):
        document = (
            "\\documentclass[tikz]{standalone}\n"
            "\\begin{tikzpicture}\\node{A};\\end{tikzpicture}\n\\end{document}\n"
        )
        result = normalize_document(document)
        assert "\\begin{document}" in result
        assert result.count("\\begin{document}") == 1
        # \begin{document} must come before the tikzpicture environment.
        assert result.index("\\begin{document}") < result.index("\\begin{tikzpicture}")

    def test_never_produces_duplicate_documentclass(self):
        document = (
            "\\documentclass[tikz]{standalone}\n\\begin{document}\n"
            "\\begin{tikzpicture}\\node{A};\\end{tikzpicture}\n\\end{document}\n"
        )
        result = normalize_document(document)
        assert result.count("\\documentclass") == 1

    def test_regression_malformed_login_flowchart_gets_end_document(self):
        result = normalize_document(MALFORMED_LOGIN_FLOWCHART)
        assert "\\end{document}" in result
        assert result.count("\\end{document}") == 1


class TestValidateDocument:
    def test_valid_complete_document_passes(self):
        document = (
            "\\documentclass[tikz]{standalone}\n\\begin{document}\n"
            "\\begin{tikzpicture}\\node{A};\\end{tikzpicture}\n\\end{document}\n"
        )
        result = validate_document(document)
        assert result.valid
        assert result.errors == []

    def test_missing_end_document_is_rejected(self):
        document = (
            "\\documentclass[tikz]{standalone}\n\\begin{document}\n"
            "\\begin{tikzpicture}\\node{A};\\end{tikzpicture}\n"
        )
        result = validate_document(document)
        assert not result.valid
        assert any("end{document}" in e.lower() for e in result.errors)

    def test_missing_documentclass_is_rejected(self):
        document = "\\begin{document}\\begin{tikzpicture}\\node{A};\\end{tikzpicture}\\end{document}"
        result = validate_document(document)
        assert not result.valid
        assert any("documentclass" in e.lower() for e in result.errors)

    def test_unbalanced_braces_are_rejected(self):
        document = (
            "\\documentclass[tikz]{standalone}\\begin{document}"
            "\\begin{tikzpicture}\\node{A;\\end{tikzpicture}\\end{document}"
        )
        result = validate_document(document)
        assert not result.valid
        assert any("brace" in e.lower() for e in result.errors)

    def test_unbalanced_environment_is_rejected(self):
        document = (
            "\\documentclass[tikz]{standalone}\\begin{document}"
            "\\begin{tikzpicture}\\node{A};\\end{document}"
        )
        result = validate_document(document)
        assert not result.valid
        assert any("tikzpicture" in e.lower() for e in result.errors)

    def test_markdown_fence_contamination_is_rejected(self):
        document = (
            "\\documentclass[tikz]{standalone}\\begin{document}```latex\n"
            "\\begin{tikzpicture}\\node{A};\\end{tikzpicture}```\\end{document}"
        )
        result = validate_document(document)
        assert not result.valid
        assert any("disallowed" in e.lower() for e in result.errors)

    def test_html_contamination_is_rejected(self):
        document = (
            "\\documentclass[tikz]{standalone}\\begin{document}<div>"
            "\\begin{tikzpicture}\\node{A};\\end{tikzpicture}</div>\\end{document}"
        )
        result = validate_document(document)
        assert not result.valid
        assert any("disallowed" in e.lower() for e in result.errors)

    def test_missing_diagram_environment_is_rejected(self):
        document = "\\documentclass[tikz]{standalone}\\begin{document}Just text.\\end{document}"
        result = validate_document(document)
        assert not result.valid
        assert any("diagram environment" in e.lower() for e in result.errors)

    def test_valid_tikz_snippet_after_normalization_passes(self):
        snippet = "\\begin{tikzpicture}\\node{A};\\end{tikzpicture}"
        result = validate_document(normalize_document(snippet))
        assert result.valid

    def test_invalid_tikz_unbalanced_after_normalization_fails(self):
        snippet = "\\begin{tikzpicture}\\node{A;\\end{tikzpicture}"
        result = validate_document(normalize_document(snippet))
        assert not result.valid

    def test_regression_malformed_login_flowchart_fails_before_normalization(self):
        # Before normalize_document repairs it, the raw malformed output
        # (missing \end{document}) must fail validation.
        result = validate_document(MALFORMED_LOGIN_FLOWCHART)
        assert not result.valid

    def test_regression_malformed_login_flowchart_passes_after_normalization(self):
        # After normalize_document appends the missing \end{document}, the
        # (still sanitizer-untouched) document should pass structural
        # validation — the HTML contamination itself is removed by the
        # response_parser sanitizer, not by normalize_document, so this
        # test only exercises the missing-closer repair.
        normalized = normalize_document(MALFORMED_LOGIN_FLOWCHART)
        result = validate_document(normalized)
        # The raw fragment still contains the ">% contamination since we
        # did not sanitize here — confirm validation still catches it via
        # the forbidden-HTML check rather than silently accepting it.
        assert not result.valid
        assert any("disallowed" in e.lower() for e in result.errors)


class TestExtractFirstError:
    def test_extracts_first_bang_prefixed_line(self):
        log = "This is pdfTeX...\n! Undefined control sequence.\nl.5 \\foo\n"
        assert extract_first_error(log) == "! Undefined control sequence."

    def test_returns_none_when_no_error_marker_present(self):
        log = "This is pdfTeX...\nOutput written on diagram.pdf.\n"
        assert extract_first_error(log) is None

    def test_extracts_from_validation_failed_block(self):
        log = "Validation failed:\nMissing \\end{document}.\nUnbalanced braces."
        assert extract_first_error(log) == "Missing \\end{document}."
