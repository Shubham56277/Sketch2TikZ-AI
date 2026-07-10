"""
IBM Cloudant integration for project persistence.

This module is the ONLY place ibmcloudant is imported. Services call the
functions below and never touch the Cloudant SDK directly. Documents are
stored as plain dicts matching app.models.project.Project's shape, plus
Cloudant's own `_id` / `_rev` fields.
"""

import logging
from typing import Any, Dict, List, Optional, Tuple

from ibmcloudant.cloudant_v1 import CloudantV1
from ibm_cloud_sdk_core.authenticators import IAMAuthenticator

from app.config import get_settings

logger = logging.getLogger("sketch2tikz.database")

_client: Optional[CloudantV1] = None


def _get_client() -> CloudantV1:
    global _client
    if _client is None:
        settings = get_settings()
        authenticator = IAMAuthenticator(apikey=settings.cloudant_apikey)
        client = CloudantV1(authenticator=authenticator)
        client.set_service_url(settings.cloudant_url)
        _client = client
    return _client


def is_configured() -> bool:
    return get_settings().is_cloudant_configured


def ensure_database_exists() -> None:
    """Idempotently creates the projects database. Safe to call on every startup."""
    settings = get_settings()
    client = _get_client()
    try:
        client.get_database_information(db=settings.cloudant_db_name).get_result()
    except Exception:
        client.put_database(db=settings.cloudant_db_name).get_result()
        logger.info("Created Cloudant database: %s", settings.cloudant_db_name)


def put_document(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Creates or updates a document. `doc` must include `_id`; `_rev` is required for updates."""
    settings = get_settings()
    client = _get_client()
    result = client.post_document(db=settings.cloudant_db_name, document=doc).get_result()
    doc["_rev"] = result["rev"]
    return doc


def get_document(doc_id: str) -> Optional[Dict[str, Any]]:
    settings = get_settings()
    client = _get_client()
    try:
        return client.get_document(db=settings.cloudant_db_name, doc_id=doc_id).get_result()
    except Exception:
        return None


def delete_document(doc_id: str, rev: str) -> None:
    settings = get_settings()
    client = _get_client()
    client.delete_document(db=settings.cloudant_db_name, doc_id=doc_id, rev=rev).get_result()


def list_documents(limit: int = 50, skip: int = 0) -> Tuple[List[Dict[str, Any]], int]:
    """
    Returns (page_of_documents, total_count), newest first. For the current
    project scale (single-tenant MVP) a full-database scan with in-memory sort
    is acceptable; if project counts grow large, replace with a Cloudant
    secondary index sorted by updated_at.
    """
    settings = get_settings()
    client = _get_client()
    result = client.post_all_docs(
        db=settings.cloudant_db_name,
        include_docs=True,
        limit=10_000,
    ).get_result()

    docs = [row["doc"] for row in result.get("rows", []) if "doc" in row]
    docs.sort(key=lambda d: d.get("updated_at", ""), reverse=True)
    return docs[skip: skip + limit], len(docs)
