"""Cache helpers — Redis in production, local memory fallback in SQLite/dev."""

from __future__ import annotations

import hashlib
import json
from typing import Any, Callable

from django.conf import settings
from django.core.cache import cache


def cache_key(*parts: Any) -> str:
    raw = ":".join(str(p) for p in parts)
    digest = hashlib.sha256(raw.encode()).hexdigest()[:24]
    return f"iua:{digest}"


def cached_value(key: str, producer: Callable[[], Any], timeout: int = 60) -> Any:
    """
    Get-or-set cache. Timeout in seconds.
    Direction/admin KPIs use short TTL so they stay near real-time
    without hammering COUNT(*) on every request.
    """
    if getattr(settings, "DISABLE_CACHE", False):
        return producer()

    hit = cache.get(key)
    if hit is not None:
        return hit
    value = producer()
    # Ensure JSON-serializable payloads for Redis
    if isinstance(value, (dict, list)):
        cache.set(key, value, timeout)
    else:
        cache.set(key, json.loads(json.dumps(value, default=str)), timeout)
    return value


def invalidate_prefix_keys(*keys: str) -> None:
    cache.delete_many(list(keys))
