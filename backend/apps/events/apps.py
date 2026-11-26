from django.apps import AppConfig


class EventsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.events"
    label = "events"
    verbose_name = "Bus d'événements"

    def ready(self):
        from apps.events import handlers  # noqa: F401
