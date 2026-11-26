from django.db import models

from apps.core.models import TimeStampedModel, UUIDModel


class OutboxMessage(UUIDModel, TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        PUBLISHED = "published", "Published"
        FAILED = "failed", "Failed"

    event_type = models.CharField(max_length=128, db_index=True)
    aggregate_type = models.CharField(max_length=64)
    aggregate_id = models.CharField(max_length=64)
    payload = models.JSONField(default=dict)
    source = models.CharField(max_length=64)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING, db_index=True)
    attempts = models.PositiveIntegerField(default=0)
    last_error = models.TextField(blank=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["status", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.event_type}:{self.id}"


class ProcessedEvent(UUIDModel):
    event_id = models.UUIDField()
    handler_name = models.CharField(max_length=128)
    processed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("event_id", "handler_name")


class DeadLetterEvent(UUIDModel, TimeStampedModel):
    event_id = models.UUIDField()
    event_type = models.CharField(max_length=128)
    payload = models.JSONField(default=dict)
    handler_name = models.CharField(max_length=128)
    error = models.TextField()
    resolved = models.BooleanField(default=False)
