from __future__ import annotations

from apps.identity.models import User
from apps.notifications.models import Notification


def notify_user(
    *,
    user: User,
    title: str,
    body: str,
    category: str = "general",
    priority: str = Notification.Priority.NORMAL,
    data: dict | None = None,
) -> Notification:
    return Notification.objects.create(
        recipient=user,
        title=title,
        body=body,
        category=category,
        priority=priority,
        data=data or {},
    )
