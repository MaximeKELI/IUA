from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.admissions.views import AdmissionApplicationViewSet

router = DefaultRouter()
router.register(r"admissions/applications", AdmissionApplicationViewSet, basename="admissions")

urlpatterns = [
    path("", include(router.urls)),
]
