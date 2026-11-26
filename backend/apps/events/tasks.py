from celery import shared_task

from apps.events.services import relay_pending


@shared_task(name="apps.events.tasks.relay_outbox")
def relay_outbox(limit: int = 50) -> int:
    return relay_pending(limit=limit)
