"""
Orchestrates project CRUD against Cloudant, including version-history
bookkeeping and cleanup of associated COS assets on delete.
"""

import logging
from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from app.database import cloudant_client
from app.models.project import (
    Project,
    ProjectCreate,
    ProjectListItem,
    ProjectListResponse,
    ProjectUpdate,
    ProjectVersion,
)
from app.storage import cos_client

logger = logging.getLogger("sketch2tikz.project_service")


class ProjectNotFound(LookupError):
    pass


def _doc_to_project(doc: dict) -> Project:
    return Project(
        id=doc["_id"],
        name=doc["name"],
        diagram_type=doc["diagram_type"],
        code=doc.get("code", ""),
        explanation=doc.get("explanation"),
        pdf_url=doc.get("pdf_url"),
        is_favorite=doc.get("is_favorite", False),
        owner_id=doc.get("owner_id", "anonymous"),
        versions=[ProjectVersion(**v) for v in doc.get("versions", [])],
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
        rev=doc.get("_rev"),
    )


def _project_to_doc(project: Project) -> dict:
    doc = project.model_dump(mode="json", exclude={"rev", "id"})
    doc["_id"] = project.id
    if project.rev:
        doc["_rev"] = project.rev
    return doc


async def create_project(payload: ProjectCreate) -> Project:
    now = datetime.now(timezone.utc)
    project_id = uuid4().hex
    initial_version = ProjectVersion(code=payload.code, explanation=payload.explanation)

    project = Project(
        id=project_id,
        name=payload.name,
        diagram_type=payload.diagram_type,
        code=payload.code,
        explanation=payload.explanation,
        is_favorite=payload.is_favorite,
        versions=[initial_version] if payload.code else [],
        created_at=now,
        updated_at=now,
    )

    doc = _project_to_doc(project)
    saved = cloudant_client.put_document(doc)
    project.rev = saved.get("_rev")
    return project


async def get_project(project_id: str) -> Project:
    doc = cloudant_client.get_document(project_id)
    if doc is None:
        raise ProjectNotFound(project_id)
    return _doc_to_project(doc)


async def list_projects(limit: int = 50, skip: int = 0) -> ProjectListResponse:
    docs, total = cloudant_client.list_documents(limit=limit, skip=skip)
    items = [
        ProjectListItem(
            id=doc["_id"],
            name=doc["name"],
            diagram_type=doc["diagram_type"],
            pdf_url=doc.get("pdf_url"),
            is_favorite=doc.get("is_favorite", False),
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
        )
        for doc in docs
    ]
    return ProjectListResponse(items=items, total=total)


async def update_project(project_id: str, payload: ProjectUpdate) -> Project:
    project = await get_project(project_id)

    update_data = payload.model_dump(exclude_unset=True, exclude={"save_as_new_version"})
    for field, value in update_data.items():
        setattr(project, field, value)

    if payload.save_as_new_version and payload.code is not None:
        project.versions.append(
            ProjectVersion(code=payload.code, explanation=payload.explanation, pdf_url=payload.pdf_url)
        )

    project.updated_at = datetime.now(timezone.utc)

    doc = _project_to_doc(project)
    saved = cloudant_client.put_document(doc)
    project.rev = saved.get("_rev")
    return project


async def delete_project(project_id: str) -> None:
    project = await get_project(project_id)
    if project.rev is None:
        raise ProjectNotFound(project_id)

    if cos_client.is_configured():
        try:
            cos_client.delete_prefix(f"projects/{project_id}/")
        except Exception:
            logger.warning("Failed to clean up COS assets for project %s", project_id, exc_info=True)

    cloudant_client.delete_document(project_id, project.rev)
