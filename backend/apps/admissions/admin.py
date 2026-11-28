from django.contrib import admin

from apps.admissions.models import AdmissionApplication


@admin.register(AdmissionApplication)
class AdmissionApplicationAdmin(admin.ModelAdmin):
    list_display = ("email", "country", "nationality", "status", "created_at")
    list_filter = ("status", "country")
    search_fields = ("email", "passport", "program")
