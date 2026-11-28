import secrets

from django.db import migrations, models


def _token():
    return secrets.token_urlsafe(16)


def backfill_tokens(apps, schema_editor):
    AdmissionApplication = apps.get_model("admissions", "AdmissionApplication")
    for app in AdmissionApplication.objects.filter(tracking_token=""):
        app.tracking_token = _token()
        app.save(update_fields=["tracking_token"])


class Migration(migrations.Migration):
    dependencies = [
        ("admissions", "0001_critical_p0_p1"),
    ]

    operations = [
        migrations.AddField(
            model_name="admissionapplication",
            name="tracking_token",
            field=models.CharField(blank=True, default="", max_length=64),
        ),
        migrations.RunPython(backfill_tokens, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="admissionapplication",
            name="tracking_token",
            field=models.CharField(
                db_index=True,
                default=_token,
                editable=False,
                max_length=64,
                unique=True,
            ),
        ),
    ]
