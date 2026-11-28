import secrets

from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel, UUIDModel


def _tracking_token() -> str:
    return secrets.token_urlsafe(16)


class AdmissionApplication(UUIDModel, TimeStampedModel):
    class Status(models.TextChoices):
        SUBMITTED = "submitted", "Soumise"
        UNDER_REVIEW = "under_review", "En examen"
        ACCEPTED = "accepted", "Acceptée"
        REJECTED = "rejected", "Refusée"

    country = models.CharField(max_length=128)
    nationality = models.CharField(max_length=128)
    passport = models.CharField(max_length=64)
    phone = models.CharField(max_length=32)
    email = models.EmailField(db_index=True)
    program = models.CharField(max_length=255, blank=True)
    diploma = models.CharField(max_length=255, blank=True)
    payment_preference = models.CharField(max_length=32, blank=True, default="momo")
    status = models.CharField(
        max_length=32, choices=Status.choices, default=Status.SUBMITTED, db_index=True
    )
    tracking_token = models.CharField(
        max_length=64, unique=True, db_index=True, default=_tracking_token, editable=False
    )
    staff_note = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="admission_reviews",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "-created_at"]),
            models.Index(fields=["email", "-created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.email} — {self.status}"
