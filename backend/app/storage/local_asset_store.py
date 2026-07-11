"""Bounded, temporary fallback cache for successfully compiled previews."""

import threading
import time
from dataclasses import dataclass
from uuid import uuid4

_TTL_SECONDS = 15 * 60
_MAX_ITEMS = 64
_lock = threading.Lock()


@dataclass
class _Asset:
    data: bytes
    content_type: str
    expires_at: float


_assets: dict[str, _Asset] = {}


def _purge(now: float) -> None:
    for key in [key for key, asset in _assets.items() if asset.expires_at <= now]:
        _assets.pop(key, None)
    while len(_assets) >= _MAX_ITEMS:
        oldest = min(_assets, key=lambda key: _assets[key].expires_at)
        _assets.pop(oldest, None)


def put(data: bytes, content_type: str) -> str:
    now = time.monotonic()
    token = uuid4().hex
    with _lock:
        _purge(now)
        _assets[token] = _Asset(data, content_type, now + _TTL_SECONDS)
    return f"/assets/local/{token}"


def get(token: str) -> tuple[bytes, str] | None:
    now = time.monotonic()
    with _lock:
        asset = _assets.get(token)
        if asset is None or asset.expires_at <= now:
            _assets.pop(token, None)
            return None
        return asset.data, asset.content_type
