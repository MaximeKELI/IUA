"""Ops / direction extras — campus announcements, partners, audit trail."""

from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel, UUIDModel


class CampusAnnouncement(UUIDModel, TimeStampedModel):
    title = models.CharField(max_length=255)
    body = models.TextField()
    audience = models.CharField(max_length=32, default="all")  # all, students, staff, direction
    is_published = models.BooleanField(default=True)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="campus_announcements",
    )


class MobilityPartner(UUIDModel, TimeStampedModel):
    name = models.CharField(max_length=255)
    region = models.CharField(max_length=128, blank=True)
    focus = models.CharField(max_length=255, blank=True)
    country = models.CharField(max_length=128, blank=True)
    is_active = models.BooleanField(default=True)


class AuditEvent(UUIDModel, TimeStampedModel):
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_events",
    )
    action = models.CharField(max_length=128)
    entity = models.CharField(max_length=128, blank=True)
    detail = models.TextField(blank=True)
