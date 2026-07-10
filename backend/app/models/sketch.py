"""Schema for POST /upload-sketch."""

from typing import Optional

from pydantic import BaseModel

from app.models.common import DiagramType


class UploadSketchResponse(BaseModel):
    code: str
    explanation: str
    diagram_type: DiagramType
    model_id: str
    sketch_url: str
    project_id: Optional[str] = None
