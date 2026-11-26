from django.contrib import admin

from apps.events.models import DeadLetterEvent, OutboxMessage, ProcessedEvent

admin.site.register(OutboxMessage)
admin.site.register(ProcessedEvent)
admin.site.register(DeadLetterEvent)
