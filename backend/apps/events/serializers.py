from rest_framework import serializers

from apps.events.models import DeadLetterEvent, OutboxMessage


class OutboxSerializer(serializers.ModelSerializer):
    class Meta:
        model = OutboxMessage
        fields = (
            "id",
            "event_type",
            "aggregate_type",
            "aggregate_id",
            "payload",
            "source",
            "status",
            "attempts",
            "last_error",
            "created_at",
            "published_at",
        )


class DeadLetterSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeadLetterEvent
        fields = (
            "id",
            "event_id",
            "event_type",
            "payload",
            "handler_name",
            "error",
            "resolved",
            "created_at",
        )
