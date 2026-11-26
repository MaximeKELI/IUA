from django.contrib import admin

from apps.core.models import AuditLog

admin.site.register(AuditLog)
