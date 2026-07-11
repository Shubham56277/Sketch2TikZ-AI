"""
End-to-end compiler tests that actually invoke pdflatex/pdftoppm. These are
skipped automatically if the LaTeX engine isn't available in the current
environment (e.g. a CI runner without TeX Live), so they never block a
plain `pytest` run on a machine without LaTeX installed, but exercise the
real toolchain wherever it is present (this repo's Docker image always has
it, and so does the developer's machine in this project).
"""

import shutil
import tempfile

import pytest

from app.compiler.latex_compiler import cleanup_workdir, compile_tikz

pytestmark = pytest.mark.skipif(
    shutil.which("pdflatex") is None, reason="pdflatex is not installed in this environment"
)


@pytest.fixture(autouse=True)
def _use_space_free_tempdir(monkeypatch):
    """
    On Windows, a username containing a space (e.g. 'Shubham mankar') breaks
    MiKTeX's own argument parsing of the default %TEMP% path. Redirect
    tempfile to a space-free directory for the duration of these tests only.
    """
    safe_dir = tempfile.mkdtemp(prefix="s2t_test_tmp_")
    monkeypatch.setattr(tempfile, "tempdir", safe_dir)
    yield
    shutil.rmtree(safe_dir, ignore_errors=True)


class TestCompileTikzIntegration:
    async def test_valid_tikz_snippet_compiles_successfully(self):
        result = await compile_tikz("\\begin{tikzpicture}\\node{Hello};\\end{tikzpicture}")
        try:
            assert result.success
            assert result.pdf_path is not None
            assert result.pdf_path.exists()
        finally:
            if result.pdf_path:
                cleanup_workdir(result.pdf_path)

    async def test_invalid_tikz_fails_with_first_error_populated(self):
        # Unbalanced brace — caught by structural validation before pdflatex
        # even runs, so this also confirms the validation short-circuit path.
        result = await compile_tikz("\\begin{tikzpicture}\\node{Hello;\\end{tikzpicture}")
        assert not result.success
        assert result.stage == "validation"
        assert result.first_error is not None

    async def test_regression_malformed_login_flowchart_fails_cleanly_not_crash(self):
        """
        The exact production bug report input must never crash the process
        or hang — it should be rejected by validation with a clear reason
        (missing \\end{document} and/or HTML contamination), well before
        ever reaching pdflatex.
        """
        from tests.test_response_parser import MALFORMED_LOGIN_FLOWCHART

        result = await compile_tikz(MALFORMED_LOGIN_FLOWCHART)
        assert not result.success
        assert result.stage == "validation"
