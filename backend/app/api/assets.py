"""
GET /assets/{key} — proxies objects out of Cloud Object Storage.

Returning our own URL (rather than a raw COS presigned URL) from upload
operations means we can add auth/rate-limiting/caching here later without
changing any client code or previously-issued URLs.
"""

import logging
import mimetypes

from fastapi import APIRouter, HTTPException, Response

from app.storage import cos_client

logger = logging.getLogger("sketch2tikz.api.assets")
router = APIRouter(tags=["assets"])


@router.get("/assets/{key:path}")
async def get_asset(key: str) -> Response:
    try:
        data = cos_client.download_bytes(key)
    except Exception as exc:
        raise HTTPException(status_code=404, detail="Asset not found") from exc

    content_type, _ = mimetypes.guess_type(key)
    return Response(content=data, media_type=content_type or "application/octet-stream")
