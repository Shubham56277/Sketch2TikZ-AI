"""GET /health — liveness/readiness probe, also reports which integrations are configured."""

from fastapi import APIRouter
from pydantic import BaseModel

from app.agents import watsonx_client
from app.database import cloudant_client
from app.storage import cos_client

router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    status: str
    watsonx_configured: bool
    cloudant_configured: bool
    object_storage_configured: bool


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        watsonx_configured=watsonx_client.is_configured(),
        cloudant_configured=cloudant_client.is_configured(),
        object_storage_configured=cos_client.is_configured(),
    )
