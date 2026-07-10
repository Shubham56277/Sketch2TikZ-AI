"""
FastAPI application entrypoint.

Run locally with: uvicorn app.main:app --reload --port 8000
"""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import assets, compile, generate, health, projects, sketch
from app.config import get_settings
from app.database import cloudant_client

settings = get_settings()

logging.basicConfig(
    level=settings.log_level,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("sketch2tikz.main")

app = FastAPI(
    title="Sketch2TikZ AI Backend",
    description="Converts natural language prompts and hand-drawn sketches into LaTeX/TikZ diagrams using IBM Granite.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(generate.router)
app.include_router(compile.router)
app.include_router(sketch.router)
app.include_router(projects.router)
app.include_router(assets.router)


@app.on_event("startup")
async def on_startup() -> None:
    logger.info("Starting Sketch2TikZ AI backend (env=%s)", settings.app_env)
    if cloudant_client.is_configured():
        try:
            cloudant_client.ensure_database_exists()
        except Exception:
            logger.exception("Failed to ensure Cloudant database exists")
    else:
        logger.warning("Cloudant is not configured — /projects endpoints will fail until it is.")

    if not settings.is_watsonx_configured:
        logger.warning("watsonx.ai is not configured — /generate, /autofix, /upload-sketch will fail until it is.")

    from app.storage import cos_client

    if not cos_client.is_configured():
        logger.warning("Object Storage is not configured — file uploads/exports will fail until it is.")
