"""
Schemas for the /projects CRUD endpoints.

Design note: each project stores a `versions` list from day one (even though
the current UI only surfaces the latest version) so that "Version history",
listed as a future feature, is a read on existing data rather than a schema
migration later. Every successful /generate, /compile, or manual save that is
tied to a project_id appends a new ProjectVersion.
"""

from datetime import datetime, timezone
from typing import List, Optional
from uuid import uuid4

from pydantic import BaseModel, Field

from app.models.common import DiagramType


class ProjectVersion(BaseModel):
    version_id: str = Field(default_factory=lambda: uuid4().hex)
    code: str
    explanation: Optional[str] = None
    pdf_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: str = "system"  # placeholder seam for future auth (user id)


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    diagram_type: DiagramType = DiagramType.GENERIC
    code: str = ""
    explanation: Optional[str] = None
    is_favorite: bool = False


class ProjectUpdate(BaseModel):
    """All fields optional — PUT /projects/{id} performs a partial update."""

    name: Optional[str] = None
    diagram_type: Optional[DiagramType] = None
    code: Optional[str] = None
    explanation: Optional[str] = None
    is_favorite: Optional[bool] = None
    pdf_url: Optional[str] = None
    # When provided, a new ProjectVersion snapshot is appended.
    save_as_new_version: bool = False


class Project(BaseModel):
    id: str
    name: str
    diagram_type: DiagramType
    code: str
    explanation: Optional[str] = None
    pdf_url: Optional[str] = None
    is_favorite: bool = False
    owner_id: str = "anonymous"  # placeholder seam for future auth
    versions: List[ProjectVersion] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    # Cloudant revision token — needed for updates/deletes, hidden from most API responses.
    rev: Optional[str] = Field(default=None, exclude=True)


class ProjectListItem(BaseModel):
    """Lightweight shape for GET /projects list responses (no full version history)."""

    id: str
    name: str
    diagram_type: DiagramType
    pdf_url: Optional[str] = None
    is_favorite: bool = False
    created_at: datetime
    updated_at: datetime


class ProjectListResponse(BaseModel):
    items: List[ProjectListItem]
    total: int
