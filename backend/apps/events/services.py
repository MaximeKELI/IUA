from __future__ import annotations

import logging
from typing import Any

from django.db import connection, transaction
from django.utils import timezone

from apps.events.models import DeadLetterEvent, OutboxMessage, ProcessedEvent
from apps.events.registry import get_handlers

logger = logging.getLogger(__name__)


def emit_event(
    *,
    event_type: str,
    aggregate_type: str,
    aggregate_id: str,
    payload: dict[str, Any] | None = None,
    source: str = "system",
) -> OutboxMessage:
    """Persist an event in the outbox within the current transaction."""
    return OutboxMessage.objects.create(
        event_type=event_type,
        aggregate_type=aggregate_type,
        aggregate_id=str(aggregate_id),
        payload=payload or {},
        source=source,
        status=OutboxMessage.Status.PENDING,
    )


@transaction.atomic
def dispatch_message(message: OutboxMessage) -> None:
    message.status = OutboxMessage.Status.PROCESSING
    message.attempts += 1
    message.save(update_fields=["status", "attempts", "updated_at"])

    handlers = get_handlers(message.event_type)
    errors: list[str] = []

    for handler in handlers:
        handler_name = f"{handler.__module__}.{handler.__name__}"
        if ProcessedEvent.objects.filter(event_id=message.id, handler_name=handler_name).exists():
            continue
        try:
            handler(message)
            ProcessedEvent.objects.create(event_id=message.id, handler_name=handler_name)
        except Exception as exc:  # noqa: BLE001 — captured into dead letter
            logger.exception("Handler %s failed for %s", handler_name, message.id)
            errors.append(f"{handler_name}: {exc}")
            DeadLetterEvent.objects.create(
                event_id=message.id,
                event_type=message.event_type,
                payload=message.payload,
                handler_name=handler_name,
                error=str(exc),
            )

    if errors:
        message.status = OutboxMessage.Status.FAILED
        message.last_error = "\n".join(errors)
        message.save(update_fields=["status", "last_error", "updated_at"])
    else:
        message.status = OutboxMessage.Status.PUBLISHED
        message.published_at = timezone.now()
        message.last_error = ""
        message.save(update_fields=["status", "published_at", "last_error", "updated_at"])


def relay_pending(limit: int = 50) -> int:
    with transaction.atomic():
        qs = OutboxMessage.objects.filter(status=OutboxMessage.Status.PENDING).order_by("created_at")
        if connection.vendor == "postgresql":
            qs = qs.select_for_update(skip_locked=True)
        messages = list(qs[:limit])
        for message in messages:
            dispatch_message(message)
        return len(messages)
