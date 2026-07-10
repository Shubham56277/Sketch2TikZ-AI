"""Orchestrates sketch upload: store the image, then run it through the vision model."""

import logging

from app.agents import prompts, watsonx_client
from app.agents.response_parser import parse_model_response
from app.config import get_settings
from app.models.common import DiagramType
from app.models.sketch import UploadSketchResponse
from app.storage import cos_client

logger = logging.getLogger("sketch2tikz.sketch_service")

_ALLOWED_MIME_TYPES = {"image/png", "image/jpeg", "image/webp"}
_MAX_UPLOAD_BYTES = 8 * 1024 * 1024  # 8 MB


class UnsupportedSketchFormat(ValueError):
    pass


class SketchTooLarge(ValueError):
    pass


async def process_sketch_upload(
    image_bytes: bytes,
    mime_type: str,
    filename: str,
    diagram_type: DiagramType,
    project_id: str | None,
) -> UploadSketchResponse:
    if mime_type not in _ALLOWED_MIME_TYPES:
        raise UnsupportedSketchFormat(f"Unsupported image type: {mime_type}")
    if len(image_bytes) > _MAX_UPLOAD_BYTES:
        raise SketchTooLarge("Sketch image exceeds the 8MB upload limit")

    settings = get_settings()

    sketch_url = ""
    if cos_client.is_configured():
        key = cos_client.build_key(filename, project_id=project_id)
        sketch_url = cos_client.upload_bytes(image_bytes, key, mime_type)

    user_text = f"Convert this hand-drawn {diagram_type.value.replace('_', ' ')} sketch into TikZ."
    raw = await watsonx_client.generate_from_image(
        prompts.SKETCH_SYSTEM_PROMPT, user_text, image_bytes, mime_type
    )
    parsed = parse_model_response(raw)

    return UploadSketchResponse(
        code=parsed.code,
        explanation=parsed.explanation,
        diagram_type=diagram_type,
        model_id=settings.watsonx_vision_model_id,
        sketch_url=sketch_url,
        project_id=project_id,
    )
