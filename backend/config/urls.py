from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.permissions import IsAdminUser, IsAuthenticated

from apps.core.root_views import RootView


class StaffSchemaView(SpectacularAPIView):
    """OpenAPI schema — authenticated staff only (or open in DEBUG)."""

    def get_permissions(self):
        if settings.DEBUG:
            return []
        return [IsAuthenticated(), IsAdminUser()]


class StaffSwaggerView(SpectacularSwaggerView):
    def get_permissions(self):
        if settings.DEBUG:
            return []
        return [IsAuthenticated(), IsAdminUser()]


urlpatterns = [
    path("", RootView.as_view(), name="root"),
    path("admin/", admin.site.urls),
    path("api/schema/", StaffSchemaView.as_view(), name="schema"),
    path(
        "api/docs/",
        StaffSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path("api/v1/", include("config.api_urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
