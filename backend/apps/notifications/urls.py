from django.urls import path

from apps.notifications.views import (
    NotificationListView,
    NotificationMarkAllReadView,
    NotificationMarkReadView,
)

urlpatterns = [
    path("notifications/", NotificationListView.as_view(), name="notifications-list"),
    path("notifications/<uuid:pk>/read/", NotificationMarkReadView.as_view(), name="notifications-read"),
    path("notifications/read-all/", NotificationMarkAllReadView.as_view(), name="notifications-read-all"),
]
