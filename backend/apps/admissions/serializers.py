from rest_framework import serializers

from apps.admissions.models import AdmissionApplication


class AdmissionApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdmissionApplication
        fields = (
            "id",
            "country",
            "nationality",
            "passport",
            "phone",
            "email",
            "program",
            "diploma",
            "payment_preference",
            "status",
            "tracking_token",
            "staff_note",
            "reviewed_by",
            "reviewed_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "status",
            "tracking_token",
            "staff_note",
            "reviewed_by",
            "reviewed_at",
            "created_at",
            "updated_at",
        )


class AdmissionReviewSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=[
            AdmissionApplication.Status.UNDER_REVIEW,
            AdmissionApplication.Status.ACCEPTED,
            AdmissionApplication.Status.REJECTED,
        ]
    )
    staff_note = serializers.CharField(required=False, allow_blank=True)
