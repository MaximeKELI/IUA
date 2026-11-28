from __future__ import annotations

import logging

from django.conf import settings
from django.core.mail import send_mail

from apps.identity.models import User
from apps.notifications.models import Notification

logger = logging.getLogger("iua.notifications")


def send_transactional_mail(
    *,
    to: str,
    subject: str,
    body: str,
) -> bool:
    """Send a plain-text transactional email. Returns True on success."""
    if not to:
        return False
    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
            recipient_list=[to],
            fail_silently=False,
        )
        return True
    except Exception:
        logger.exception("transactional mail failed to=%s subject=%s", to, subject)
        return False


def notify_user(
    *,
    user: User,
    title: str,
    body: str,
    category: str = "general",
    priority: str = Notification.Priority.NORMAL,
    data: dict | None = None,
    email: bool = True,
) -> Notification:
    notif = Notification.objects.create(
        recipient=user,
        title=title,
        body=body,
        category=category,
        priority=priority,
        data=data or {},
    )
    if email and user.email:
        send_transactional_mail(
            to=user.email,
            subject=f"IUA — {title}",
            body=(
                f"Bonjour {user.full_name or ''},\n\n"
                f"{body}\n\n"
                f"— IUA Digital Campus\n"
                f"{getattr(settings, 'FRONTEND_ORIGIN', '').rstrip('/')}"
            ),
        )
    return notif
