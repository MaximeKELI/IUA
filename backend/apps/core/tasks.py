"""Celery compliance / ops tasks."""

from __future__ import annotations

from datetime import timedelta

from celery import shared_task
from django.utils import timezone


@shared_task(name="core.purge_expired_records")
def purge_expired_records() -> dict:
    """Apply DataRetentionPolicy windows to high-volume operational tables."""
    from apps.core.models import AuditLog, DataRetentionPolicy
    from apps.identity.models import LoginAttempt

    now = timezone.now()
    stats: dict[str, int] = {}

    policies = {p.resource: p for p in DataRetentionPolicy.objects.filter(enabled=True)}

    login_days = policies.get("login_attempts")
    if login_days:
        cutoff = now - timedelta(days=login_days.retention_days)
        deleted, _ = LoginAttempt.objects.filter(created_at__lt=cutoff).delete()
        stats["login_attempts"] = deleted

    notif_days = policies.get("notifications")
    if notif_days:
        try:
            from apps.notifications.models import Notification

            cutoff = now - timedelta(days=notif_days.retention_days)
            deleted, _ = Notification.objects.filter(created_at__lt=cutoff, is_read=True).delete()
            stats["notifications"] = deleted
        except Exception:
            stats["notifications"] = 0

    audit_days = policies.get("audit_logs")
    if audit_days:
        cutoff = now - timedelta(days=audit_days.retention_days)
        # Keep security-critical actions longer — only purge generic reads if any
        deleted, _ = AuditLog.objects.filter(
            created_at__lt=cutoff, action__startswith="privacy."
        ).delete()
        stats["audit_logs"] = deleted

    return {"purged": stats, "at": now.isoformat()}


@shared_task(name="core.detect_suspicious_logins")
def detect_suspicious_logins(threshold: int = 10, window_minutes: int = 15) -> dict:
    """Alert when failed login attempts spike for an email."""
    from django.db.models import Count

    from apps.identity.models import LoginAttempt, User

    since = timezone.now() - timedelta(minutes=window_minutes)
    spikes = (
        LoginAttempt.objects.filter(successful=False, created_at__gte=since)
        .values("email")
        .annotate(n=Count("id"))
        .filter(n__gte=threshold)
    )
    alerted = 0
    for row in spikes:
        email = row["email"]
        try:
            from apps.teaching.ops_views import log_audit

            log_audit(None, "security.login_spike", "LoginAttempt", f"{email}:{row['n']}")
        except Exception:
            pass
        # Notify IT users if Notification model exists
        try:
            from apps.notifications.models import Notification

            it_users = User.objects.filter(
                user_roles__role__code="it", user_roles__is_active=True, is_active=True
            ).distinct()[:20]
            for u in it_users:
                Notification.objects.create(
                    recipient=u,
                    title="Pic de connexions échouées",
                    body=f"{row['n']} échecs pour {email} en {window_minutes} min.",
                    category="security",
                )
                alerted += 1
        except Exception:
            pass
    return {"spikes": len(spikes), "notifications": alerted}
