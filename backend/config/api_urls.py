from django.urls import include, path

urlpatterns = [
    path("", include("apps.identity.urls")),
    path("", include("apps.academic.urls")),
    path("", include("apps.teaching.urls")),
    path("", include("apps.admissions.urls")),
    path("", include("apps.events.urls")),
    path("", include("apps.notifications.urls")),
    path("portal/", include("apps.core.portal_urls")),
    path("health/", include("apps.core.health_urls")),
]
