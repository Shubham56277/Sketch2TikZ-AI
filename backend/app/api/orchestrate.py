"""Curated, optionally authenticated tools for IBM watsonx Orchestrate."""

import secrets

from fastapi import APIRouter, Depends, HTTPException, Request, Security, status
from fastapi.openapi.utils import get_openapi
from fastapi.security import APIKeyHeader

from app.api import compile as compile_api
from app.api import generate as generate_api
from app.api import health as health_api
from app.config import get_settings
from app.models.compile import CompileRequest, CompileResponse
from app.models.generate import AutofixRequest, AutofixResponse, GenerateRequest, GenerateResponse

_api_key_header = APIKeyHeader(name="X-Orchestrate-API-Key", auto_error=False)


async def require_orchestrate_api_key(
    supplied_key: str | None = Security(_api_key_header),
) -> None:
    configured_key = get_settings().orchestrate_api_key.strip()
    if configured_key and (
        supplied_key is None or not secrets.compare_digest(supplied_key, configured_key)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Orchestrate API key",
        )


router = APIRouter(
    prefix="/orchestrate",
    tags=["IBM watsonx Orchestrate tools"],
    dependencies=[Depends(require_orchestrate_api_key)],
)


@router.get(
    "/health",
    response_model=health_api.HealthResponse,
    operation_id="checkSketch2TikzAvailability",
    summary="Check Sketch2TikZ service availability",
    description="Check whether Granite, Cloudant, and Object Storage are configured before creating a diagram.",
)
async def orchestrate_health() -> health_api.HealthResponse:
    return await health_api.health()


@router.post(
    "/generate",
    response_model=GenerateResponse,
    operation_id="generateAcademicTikzDiagram",
    summary="Generate an academic TikZ diagram",
    description=(
        "Convert a natural-language research diagram request into validated TikZ source. "
        "For refinements, pass the previous source in existing_code and describe the requested change."
    ),
)
async def orchestrate_generate(request: GenerateRequest) -> GenerateResponse:
    return await generate_api.generate(request)


@router.post(
    "/compile",
    response_model=CompileResponse,
    operation_id="compileTikzDiagram",
    summary="Compile and preview a TikZ diagram",
    description=(
        "Validate and compile TikZ source. A successful response includes a PDF URL. "
        "If status is failed, pass code and log to the repair tool."
    ),
)
async def orchestrate_compile(request: CompileRequest) -> CompileResponse:
    return await compile_api.compile_diagram(request)


@router.post(
    "/autofix",
    response_model=AutofixResponse,
    operation_id="repairInvalidTikzDiagram",
    summary="Repair TikZ that failed compilation",
    description=(
        "Repair invalid TikZ using the LaTeX compiler log. Use only after compilation fails, "
        "then call the compile tool again with the returned code."
    ),
)
async def orchestrate_autofix(request: AutofixRequest) -> AutofixResponse:
    return await generate_api.autofix(request)


# The specification itself must be public so Orchestrate can import it before
# a connection has been configured. Tool execution remains protected when the
# ORCHESTRATE_API_KEY environment variable is set.
spec_router = APIRouter(tags=["IBM watsonx Orchestrate integration"])


@spec_router.get("/orchestrate/openapi.json", include_in_schema=False)
async def orchestrate_openapi(request: Request) -> dict:
    full_schema = get_openapi(
        title="Sketch2TikZ watsonx Orchestrate Tools",
        version="1.0.0",
        description=(
            "Agent tools for generating, compiling, previewing, refining, and repairing "
            "publication-ready LaTeX/TikZ academic diagrams."
        ),
        routes=request.app.routes,
    )
    full_schema["paths"] = {
        path: operations
        for path, operations in full_schema["paths"].items()
        if path.startswith("/orchestrate/") and path != "/orchestrate/openapi.json"
    }
    full_schema["servers"] = [{"url": str(request.base_url).rstrip("/")}]
    return full_schema
