"""Official student documents (PDF generation)."""

from io import BytesIO

from django.http import HttpResponse
from django.utils import timezone
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.academic.models import StudentProfile


def _student_or_403(user):
    profile = StudentProfile.objects.select_related("user", "program", "cohort").filter(user=user).first()
    return profile


def _build_attestation_pdf(profile: StudentProfile, locale: str = "fr") -> bytes:
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    width, height = A4
    y = height - 72

    title = "ATTESTATION DE SCOLARITÉ" if locale.startswith("fr") else "ENROLLMENT CERTIFICATE"
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(width / 2, y, "Institut Universitaire d'Abidjan")
    y -= 28
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(width / 2, y, title)
    y -= 48

    c.setFont("Helvetica", 11)
    name = profile.user.full_name
    number = profile.student_number
    program = profile.program.name if profile.program_id else "—"
    level = profile.level or "—"
    today = timezone.localdate().strftime("%d/%m/%Y")

    if locale.startswith("fr"):
        lines = [
            f"Je soussigné(e), certifie que {name}",
            f"(matricule n° {number}) est régulièrement inscrit(e)",
            f"à l'Institut Universitaire d'Abidjan.",
            f"Formation : {program}",
            f"Niveau : {level}",
            f"Statut : {profile.status}",
            "",
            f"Fait à Abidjan, le {today}.",
            "",
            "Document généré électroniquement — IUA Digital Campus.",
        ]
    else:
        lines = [
            f"I hereby certify that {name}",
            f"(student ID {number}) is duly enrolled",
            f"at the Institut Universitaire d'Abidjan.",
            f"Program: {program}",
            f"Level: {level}",
            f"Status: {profile.status}",
            "",
            f"Issued in Abidjan on {today}.",
            "",
            "Electronically generated — IUA Digital Campus.",
        ]

    for line in lines:
        c.drawString(72, y, line)
        y -= 18

    c.showPage()
    c.save()
    return buf.getvalue()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_attestation_pdf(request):
    profile = _student_or_403(request.user)
    if not profile:
        return Response({"detail": "Profil étudiant requis."}, status=403)
    locale = (request.query_params.get("lang") or "fr").lower()
    pdf = _build_attestation_pdf(profile, locale=locale)
    filename = f"attestation-{profile.student_number}-{locale}.pdf"
    response = HttpResponse(pdf, content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response
