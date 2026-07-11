"""
Tests for app.services.compile_service — specifically the separation
between compilation success and storage success (COS upload failures must
never be reported as a LaTeX/compilation failure).
"""

import shutil
import tempfile
from unittest.mock import patch

import pytest

from app.models.common import CompileStatus
from app.models.compile import CompileRequest
from app.services import compile_service

pytestmark = pytest.mark.skipif(
    shutil.which("pdflatex") is None, reason="pdflatex is not installed in this environment"
)

VALID_TIKZ = "\\begin{tikzpicture}\\node{Hello};\\end{tikzpicture}"


@pytest.fixture(autouse=True)
def _use_space_free_tempdir(monkeypatch):
    safe_dir = tempfile.mkdtemp(prefix="s2t_test_tmp_")
    monkeypatch.setattr(tempfile, "tempdir", safe_dir)
    yield
    shutil.rmtree(safe_dir, ignore_errors=True)


class TestCompileDiagramStorageSeparation:
    async def test_successful_compile_with_cos_not_configured_still_reports_success(self):
        with patch("app.services.compile_service.cos_client.is_configured", return_value=False):
            response = await compile_service.compile_diagram(CompileRequest(code=VALID_TIKZ))

        assert response.status == CompileStatus.SUCCESS
        assert response.pdf_url is not None
        assert response.pdf_url.startswith("/assets/local/")
        assert response.storage_error is not None
        assert "not configured" in response.storage_error.lower()

    async def test_successful_compile_with_failing_cos_upload_still_reports_success(self):
        with (
            patch("app.services.compile_service.cos_client.is_configured", return_value=True),
            patch(
                "app.services.compile_service.cos_client.upload_bytes",
                side_effect=RuntimeError("AccessDenied"),
            ),
        ):
            response = await compile_service.compile_diagram(CompileRequest(code=VALID_TIKZ))

        # This is the core regression this fix targets: a COS failure must
        # NOT cause status to be reported as failed. The diagram compiled;
        # only the save step failed.
        assert response.status == CompileStatus.SUCCESS
        assert response.pdf_url is not None
        assert response.pdf_url.startswith("/assets/local/")
        assert response.storage_error is not None
        assert "AccessDenied" in response.storage_error

    async def test_successful_compile_with_working_cos_upload_returns_pdf_url(self):
        with (
            patch("app.services.compile_service.cos_client.is_configured", return_value=True),
            patch(
                "app.services.compile_service.cos_client.build_key",
                return_value="projects/test/latest/diagram.pdf",
            ),
            patch(
                "app.services.compile_service.cos_client.upload_bytes",
                return_value="/assets/projects/test/latest/diagram.pdf",
            ),
        ):
            response = await compile_service.compile_diagram(CompileRequest(code=VALID_TIKZ))

        assert response.status == CompileStatus.SUCCESS
        assert response.pdf_url == "/assets/projects/test/latest/diagram.pdf"
        assert response.storage_error is None

    async def test_invalid_latex_still_reports_failure_regardless_of_cos(self):
        with patch("app.services.compile_service.cos_client.is_configured", return_value=True):
            response = await compile_service.compile_diagram(
                CompileRequest(code="\\begin{tikzpicture}\\node{A;\\end{tikzpicture}")
            )

        assert response.status == CompileStatus.FAILED
        assert response.first_error is not None
