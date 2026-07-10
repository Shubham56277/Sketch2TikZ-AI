"""GET/POST /projects, GET/PUT/DELETE /projects/{id}."""

import logging

from fastapi import APIRouter, HTTPException, Query

from app.models.project import (
    Project,
    ProjectCreate,
    ProjectListResponse,
    ProjectUpdate,
)
from app.services import project_service
from app.services.project_service import ProjectNotFound

logger = logging.getLogger("sketch2tikz.api.projects")
router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=ProjectListResponse)
async def list_projects(
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
) -> ProjectListResponse:
    return await project_service.list_projects(limit=limit, skip=skip)


@router.post("", response_model=Project, status_code=201)
async def create_project(payload: ProjectCreate) -> Project:
    return await project_service.create_project(payload)


@router.get("/{project_id}", response_model=Project)
async def get_project(project_id: str) -> Project:
    try:
        return await project_service.get_project(project_id)
    except ProjectNotFound as exc:
        raise HTTPException(status_code=404, detail="Project not found") from exc


@router.put("/{project_id}", response_model=Project)
async def update_project(project_id: str, payload: ProjectUpdate) -> Project:
    try:
        return await project_service.update_project(project_id, payload)
    except ProjectNotFound as exc:
        raise HTTPException(status_code=404, detail="Project not found") from exc


@router.delete("/{project_id}", status_code=204)
async def delete_project(project_id: str) -> None:
    try:
        await project_service.delete_project(project_id)
    except ProjectNotFound as exc:
        raise HTTPException(status_code=404, detail="Project not found") from exc
