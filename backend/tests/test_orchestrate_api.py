from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_curated_openapi_contains_only_orchestrate_tools():
    response = client.get("/orchestrate/openapi.json")
    assert response.status_code == 200
    schema = response.json()
    assert set(schema["paths"]) == {
        "/orchestrate/health",
        "/orchestrate/generate",
        "/orchestrate/compile",
        "/orchestrate/autofix",
    }
    assert schema["paths"]["/orchestrate/generate"]["post"]["operationId"] == (
        "generateAcademicTikzDiagram"
    )


def test_tool_rejects_wrong_key_when_auth_is_configured():
    with patch(
        "app.api.orchestrate.get_settings",
        return_value=SimpleNamespace(orchestrate_api_key="correct-key"),
    ):
        response = client.get(
            "/orchestrate/health",
            headers={"X-Orchestrate-API-Key": "wrong-key"},
        )
    assert response.status_code == 401


def test_tool_accepts_key_and_delegates_to_existing_pipeline():
    health = {
        "status": "ok",
        "watsonx_configured": True,
        "cloudant_configured": True,
        "object_storage_configured": True,
        "object_storage_reachable": True,
    }
    with (
        patch(
            "app.api.orchestrate.get_settings",
            return_value=SimpleNamespace(orchestrate_api_key="correct-key"),
        ),
        patch("app.api.orchestrate.health_api.health", new=AsyncMock(return_value=health)),
    ):
        response = client.get(
            "/orchestrate/health",
            headers={"X-Orchestrate-API-Key": "correct-key"},
        )
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
