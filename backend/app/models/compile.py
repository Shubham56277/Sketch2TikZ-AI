"""Schemas for POST /compile and the /export/* endpoints."""

from typing import Optional

from pydantic import BaseModel, Field

from app.models.common import CompileStatus, ExportFormat


class CompileRequest(BaseModel):
    code: str = Field(..., min_length=1)
    project_id: Optional[str] = None


class CompileResponse(BaseModel):
    status: CompileStatus
    log: str
    pdf_url: Optional[str] = None
    duration_ms: Optional[int] = None


class ExportRequest(BaseModel):
    code: str = Field(..., min_length=1)
    project_id: Optional[str] = None
    format: ExportFormat


class ExportResponse(BaseModel):
    format: ExportFormat
    url: str
    duration_ms: Optional[int] = None
