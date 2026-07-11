"""GET /health — liveness/readiness probe, also reports which integrations are configured."""

import anyio
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
    # True only when the bucket was actually reached with the current
    # credentials — distinct from object_storage_configured, which only
    # checks that env vars are present. None means the check wasn't run
    # (e.g. object storage isn't configured at all).
    object_storage_reachable: bool | None = None


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    object_storage_reachable = None
    if cos_client.is_configured():
        object_storage_reachable, _ = await anyio.to_thread.run_sync(cos_client.check_bucket_access)

    return HealthResponse(
        status="ok",
        watsonx_configured=watsonx_client.is_configured(),
        cloudant_configured=cloudant_client.is_configured(),
        object_storage_configured=cos_client.is_configured(),
        object_storage_reachable=object_storage_reachable,
    )
