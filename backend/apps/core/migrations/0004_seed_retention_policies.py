from django.db import migrations


def seed(apps, schema_editor):
    DataRetentionPolicy = apps.get_model("core", "DataRetentionPolicy")
    defaults = [
        ("login_attempts_90d", "Login attempts", "login_attempts", 90),
        ("notifications_180d", "Read notifications", "notifications", 180),
        ("privacy_audit_730d", "Privacy audit logs", "audit_logs", 730),
    ]
    for code, name, resource, days in defaults:
        DataRetentionPolicy.objects.update_or_create(
            code=code,
            defaults={
                "name": name,
                "resource": resource,
                "retention_days": days,
                "enabled": True,
            },
        )


def unseed(apps, schema_editor):
    DataRetentionPolicy = apps.get_model("core", "DataRetentionPolicy")
    DataRetentionPolicy.objects.filter(
        code__in=["login_attempts_90d", "notifications_180d", "privacy_audit_730d"]
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0003_retention_and_login_indexes"),
    ]

    operations = [
        migrations.RunPython(seed, unseed),
    ]
