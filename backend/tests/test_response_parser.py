"""
Tests for app.agents.response_parser — the sanitization/parsing layer that
turns raw Granite output into usable TikZ source.
"""

from app.agents.response_parser import parse_model_response, sanitize_latex

# The exact malformed output reported in production: a login-authentication
# flowchart missing \end{document} and containing a stray HTML-like
# fragment (">%) that caused "Missing character" errors in pdflatex.
MALFORMED_LOGIN_FLOWCHART = r"""\documentclass[tikz]{standalone}
\usetikzlibrary{arrows.meta, calc, fit, positioning}
\usepackage{pgfplots}\pgfplotsset{compat=1.18}

\begin{document}
% Flowchart for Login Authentication
\begin{tikzpicture}[node distance = 1.7cm, auto]

    % box: Login
    \draw [rounded corners, fill=blue!20] (-3, -0.6)
    rectangle (3, 0.6);

    \node [draw, rounded corners, fill=gray!30,
    label={[label distance=-0.4cm]below:\textbf{Login}}]
    (box) at (0, 0) { };

    \node [left of=box, xshift=-0.3cm] {Username};
    \node [left of=box, xshift=0.3cm] {Password};
    \node [below of=box, yshift=-0.3cm] {Log in button};">%

    \draw (-4, 0) -- (4, 0);
\end{tikzpicture}
"""


class TestSanitizeLatex:
    def test_raw_valid_complete_latex_is_unchanged_in_substance(self):
        document = (
            "\\documentclass[tikz]{standalone}\n"
            "\\usepackage{tikz}\n"
            "\\begin{document}\n"
            "\\begin{tikzpicture}\\node{A};\\end{tikzpicture}\n"
            "\\end{document}\n"
        )
        result = sanitize_latex(document)
        assert "\\documentclass" in result
        assert "\\end{document}" in result
        assert "\\node{A}" in result

    def test_tikz_only_snippet_passes_through(self):
        snippet = "\\begin{tikzpicture}\\node{A};\\end{tikzpicture}"
        result = sanitize_latex(snippet)
        assert "\\begin{tikzpicture}" in result
        assert "\\end{tikzpicture}" in result

    def test_strips_markdown_fence_with_language_tag(self):
        text = "```latex\n\\begin{tikzpicture}\\node{A};\\end{tikzpicture}\n```"
        result = sanitize_latex(text)
        assert "```" not in result
        assert "\\begin{tikzpicture}" in result

    def test_strips_bare_markdown_fence(self):
        text = "```\n\\begin{tikzpicture}\\node{A};\\end{tikzpicture}\n```"
        result = sanitize_latex(text)
        assert "```" not in result

    def test_strips_leading_prose_before_documentclass(self):
        text = (
            "Sure! Here is your diagram:\n\n"
            "\\documentclass[tikz]{standalone}\n\\begin{document}\n"
            "\\begin{tikzpicture}\\node{A};\\end{tikzpicture}\n\\end{document}"
        )
        result = sanitize_latex(text)
        assert "Sure!" not in result
        assert result.strip().startswith("\\documentclass")

    def test_strips_leading_prose_before_bare_tikzpicture(self):
        text = "Here you go:\n\\begin{tikzpicture}\\node{A};\\end{tikzpicture}"
        result = sanitize_latex(text)
        assert "Here you go" not in result
        assert result.strip().startswith("\\begin{tikzpicture}")

    def test_strips_html_contamination_fragment(self):
        # The exact ">% fragment observed in the production bug report.
        text = '\\node [below of=box] {Log in button};">%\n\\draw (-4,0) -- (4,0);'
        result = sanitize_latex(text)
        assert '">' not in result
        assert "\\draw (-4,0) -- (4,0);" in result

    def test_strips_generic_html_tags(self):
        text = "\\begin{tikzpicture}<div>hello</div>\\node{A};\\end{tikzpicture}"
        result = sanitize_latex(text)
        assert "<div>" not in result
        assert "</div>" not in result

    def test_preserves_valid_latex_braces_and_labels(self):
        # Ensure the HTML-fragment stripper does not eat valid LaTeX like
        # label={below:\textbf{Login}} which contains braces but no tags.
        text = (
            "\\begin{tikzpicture}\\node[label={below:\\textbf{Login}}]"
            "(box){};\\end{tikzpicture}"
        )
        result = sanitize_latex(text)
        assert "label={below:\\textbf{Login}}" in result

    def test_strips_null_bytes_and_control_chars(self):
        text = "\\begin{tikzpicture}\x00\\node{A};\x07\\end{tikzpicture}"
        result = sanitize_latex(text)
        assert "\x00" not in result
        assert "\x07" not in result

    def test_normalizes_crlf_line_endings(self):
        text = "\\begin{tikzpicture}\r\n\\node{A};\r\n\\end{tikzpicture}\r\n"
        result = sanitize_latex(text)
        assert "\r" not in result

    def test_trims_leading_and_trailing_whitespace(self):
        text = "   \n\n\\begin{tikzpicture}\\node{A};\\end{tikzpicture}\n\n   "
        result = sanitize_latex(text)
        assert result == result.strip() + "\n"

    def test_empty_string_is_returned_unchanged(self):
        assert sanitize_latex("") == ""


class TestParseModelResponse:
    def test_parses_tikz_and_explanation_tags(self):
        raw = (
            "<TIKZ>\n\\begin{tikzpicture}\\node{A};\\end{tikzpicture}\n</TIKZ>\n"
            "<EXPLANATION>\nA single node.\n</EXPLANATION>"
        )
        parsed = parse_model_response(raw)
        assert "\\begin{tikzpicture}" in parsed.code
        assert parsed.explanation == "A single node."

    def test_falls_back_to_markdown_fence_when_no_tags(self):
        raw = "```latex\n\\begin{tikzpicture}\\node{A};\\end{tikzpicture}\n```"
        parsed = parse_model_response(raw)
        assert "\\begin{tikzpicture}" in parsed.code
        assert parsed.explanation == ""

    def test_falls_back_to_raw_sanitized_text_when_no_tags_or_fence(self):
        raw = "\\begin{tikzpicture}\\node{A};\\end{tikzpicture}"
        parsed = parse_model_response(raw)
        assert "\\begin{tikzpicture}" in parsed.code

    def test_prose_before_code_inside_tikz_tags_is_stripped(self):
        raw = (
            "<TIKZ>\nSure, here it is:\n"
            "\\begin{tikzpicture}\\node{A};\\end{tikzpicture}\n</TIKZ>\n"
            "<EXPLANATION>ok</EXPLANATION>"
        )
        parsed = parse_model_response(raw)
        assert "Sure" not in parsed.code

    def test_html_contamination_inside_tikz_tags_is_stripped(self):
        raw = (
            '<TIKZ>\n\\node{A};">%\n\\node{B};\n</TIKZ>\n'
            "<EXPLANATION>ok</EXPLANATION>"
        )
        parsed = parse_model_response(raw)
        assert '">' not in parsed.code

    def test_regression_malformed_login_flowchart_is_sanitized_cleanly(self):
        """
        Named regression test for the exact production bug: a full
        \\documentclass document (no <TIKZ> tags — the model bypassed the
        requested format) with a missing \\end{document} and a stray
        HTML-like fragment. After sanitization + normalization (done in
        the compiler layer), the result must be free of the contamination
        even though this module alone doesn't add the missing closer.
        """
        parsed = parse_model_response(MALFORMED_LOGIN_FLOWCHART)
        assert '">' not in parsed.code
        assert "\\begin{tikzpicture}" in parsed.code
        assert "\\node [below of=box, yshift=-0.3cm] {Log in button};" in parsed.code
