from django.urls import path

from apps.events.views import DeadLetterListView, DeadLetterRetryView, OutboxListView

urlpatterns = [
    path("events/outbox/", OutboxListView.as_view(), name="events-outbox"),
    path("events/dead-letters/", DeadLetterListView.as_view(), name="events-dead-letters"),
    path("events/dead-letters/<uuid:pk>/retry/", DeadLetterRetryView.as_view(), name="events-dead-retry"),
]
