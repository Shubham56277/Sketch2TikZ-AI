"""POST /upload-sketch."""

import logging

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.models.common import DiagramType
from app.models.sketch import UploadSketchResponse
from app.services import sketch_service
from app.services.sketch_service import SketchTooLarge, UnsupportedSketchFormat

logger = logging.getLogger("sketch2tikz.api.sketch")
router = APIRouter(tags=["sketch"])


@router.post("/upload-sketch", response_model=UploadSketchResponse)
async def upload_sketch(
    file: UploadFile = File(...),
    diagram_type: DiagramType = Form(DiagramType.GENERIC),
    project_id: str | None = Form(None),
) -> UploadSketchResponse:
    image_bytes = await file.read()
    try:
        return await sketch_service.process_sketch_upload(
            image_bytes=image_bytes,
            mime_type=file.content_type or "application/octet-stream",
            filename=file.filename or "sketch.png",
            diagram_type=diagram_type,
            project_id=project_id,
        )
    except (UnsupportedSketchFormat, SketchTooLarge) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Sketch processing failed")
        raise HTTPException(status_code=502, detail="Sketch processing failed") from exc
