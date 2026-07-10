"""Schemas for POST /generate and POST /autofix."""

from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.common import CompileStatus, DiagramType


class ChatTurn(BaseModel):
    """Mirrors the `Msg` shape already used in workspace.tsx's local chat state."""

    role: str = Field(..., pattern="^(user|assistant)$")
    content: str


class GenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=4000)
    diagram_type: DiagramType = DiagramType.GENERIC
    history: List[ChatTurn] = Field(default_factory=list)
    project_id: Optional[str] = None
    # Populated when the user is iterating on existing code ("move this box left")
    existing_code: Optional[str] = None


class GenerateResponse(BaseModel):
    code: str
    explanation: str
    diagram_type: DiagramType
    model_id: str
    # If the backend auto-compiled the result to validate it, surface that outcome.
    compile_status: Optional[CompileStatus] = None
    compile_log: Optional[str] = None
    pdf_url: Optional[str] = None


class AutofixRequest(BaseModel):
    code: str = Field(..., min_length=1)
    error_log: str = Field(..., min_length=1)
    project_id: Optional[str] = None


class AutofixResponse(BaseModel):
    code: str
    explanation: str
    fixed: bool
    attempts: int
    compile_status: Optional[CompileStatus] = None
    compile_log: Optional[str] = None
    pdf_url: Optional[str] = None
