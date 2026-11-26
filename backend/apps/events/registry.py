from __future__ import annotations

from collections import defaultdict
from collections.abc import Callable
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from apps.events.models import OutboxMessage

Handler = Callable[["OutboxMessage"], None]

_REGISTRY: dict[str, list[Handler]] = defaultdict(list)


def event_handler(event_type: str):
    def decorator(func: Handler) -> Handler:
        _REGISTRY[event_type].append(func)
        return func

    return decorator


def get_handlers(event_type: str) -> list[Handler]:
    return list(_REGISTRY.get(event_type, []))
