"""
IBM Cloud Object Storage integration.

All uploaded sketches and generated artifacts (TEX/PDF/PNG/SVG) are stored
under deterministic keys: projects/{project_id}/{version_id}/{filename}
For assets not yet tied to a saved project (e.g. a sketch uploaded before the
user names/saves the project), we use a "scratch/{uuid}" prefix instead.

This module is the ONLY place ibm_cos_sdk is imported. Services call the
functions below and never touch boto3/ibm_boto3 directly.
"""

import logging
from typing import Optional
from uuid import uuid4

import ibm_boto3
from ibm_botocore.client import Config as COSConfig

from app.config import get_settings

logger = logging.getLogger("sketch2tikz.storage")

_client = None


def _get_client():
    """Lazily create and cache the COS client (avoids import-time failures when unconfigured)."""
    global _client
    if _client is None:
        settings = get_settings()
        _client = ibm_boto3.client(
            "s3",
            ibm_api_key_id=settings.cos_api_key,
            ibm_service_instance_id=settings.cos_instance_crn,
            config=COSConfig(signature_version="oauth"),
            endpoint_url=settings.cos_endpoint,
        )
    return _client


def is_configured() -> bool:
    return get_settings().is_cos_configured


def build_key(filename: str, project_id: Optional[str] = None, version_id: Optional[str] = None) -> str:
    if project_id:
        version_segment = version_id or "latest"
        return f"projects/{project_id}/{version_segment}/{filename}"
    return f"scratch/{uuid4().hex}/{filename}"


def upload_bytes(data: bytes, key: str, content_type: str) -> str:
    """
    Uploads raw bytes to the configured bucket and returns a stable, publicly
    resolvable URL (via our own /assets proxy — see api/assets.py) rather than
    a raw COS presigned URL, so we retain control over access rules later.
    """
    settings = get_settings()
    if not is_configured():
        raise RuntimeError("Object Storage is not configured (missing COS_API_KEY/COS_INSTANCE_CRN)")

    client = _get_client()
    client.put_object(Bucket=settings.cos_bucket, Key=key, Body=data, ContentType=content_type)
    logger.info("Uploaded object to COS: %s (%d bytes)", key, len(data))
    return f"/assets/{key}"


def download_bytes(key: str) -> bytes:
    settings = get_settings()
    client = _get_client()
    obj = client.get_object(Bucket=settings.cos_bucket, Key=key)
    return obj["Body"].read()


def delete_object(key: str) -> None:
    settings = get_settings()
    client = _get_client()
    client.delete_object(Bucket=settings.cos_bucket, Key=key)


def delete_prefix(prefix: str) -> None:
    """Used when a project is deleted — removes every asset under projects/{id}/."""
    settings = get_settings()
    client = _get_client()
    paginator = client.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=settings.cos_bucket, Prefix=prefix):
        contents = page.get("Contents", [])
        if not contents:
            continue
        keys = [{"Key": obj["Key"]} for obj in contents]
        client.delete_objects(Bucket=settings.cos_bucket, Delete={"Objects": keys})
