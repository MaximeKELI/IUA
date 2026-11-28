"""Official student documents (PDF generation)."""

from io import BytesIO

from django.http import HttpResponse
from django.utils import timezone
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.academic.document_verify import issue_document_token, verify_page_url
from apps.academic.models import Grade, StudentProfile


def _student_or_403(user):
    return StudentProfile.objects.select_related("user", "program", "cohort").filter(user=user).first()


def _pdf_response(data: bytes, filename: str) -> HttpResponse:
    response = HttpResponse(data, content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response


def _qr_image(url: str) -> ImageReader | None:
    try:
        import qrcode
    except ImportError:
        return None
    qr = qrcode.QRCode(version=1, box_size=4, border=1)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return ImageReader(buf)


def _stamp_verify_qr(c: canvas.Canvas, profile: StudentProfile, doc_type: str, locale: str) -> None:
    token = issue_document_token(profile=profile, doc_type=doc_type, locale=locale)
    url = verify_page_url(token)
    qr = _qr_image(url)
    width, _height = A4
    if qr:
        c.drawImage(qr, width - 120, 40, width=70, height=70, mask="auto")
    c.setFont("Helvetica", 7)
    label = "Vérifier :" if locale.startswith("fr") else "Verify:"
    c.drawString(72, 52, f"{label} {url[:90]}")
    c.drawString(72, 40, token[:48] + "…")


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

    _stamp_verify_qr(c, profile, "attestation", locale)
    c.showPage()
    c.save()
    return buf.getvalue()


def _build_transcript_pdf(profile: StudentProfile, locale: str = "fr") -> bytes:
    grades = (
        Grade.objects.filter(student=profile, is_published=True)
        .select_related("subject", "academic_year")
        .order_by("academic_year__name", "subject__name")
    )
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    width, height = A4
    y = height - 72
    title = "RELEVÉ DE NOTES" if locale.startswith("fr") else "ACADEMIC TRANSCRIPT"
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(width / 2, y, "Institut Universitaire d'Abidjan")
    y -= 24
    c.setFont("Helvetica-Bold", 13)
    c.drawCentredString(width / 2, y, title)
    y -= 36
    c.setFont("Helvetica", 10)
    c.drawString(72, y, f"{profile.user.full_name} · {profile.student_number}")
    y -= 16
    program = profile.program.name if profile.program_id else "—"
    c.drawString(72, y, program)
    y -= 28

    c.setFont("Helvetica-Bold", 9)
    headers = (
        ["Matière", "Année", "Type", "Note", "Max"]
        if locale.startswith("fr")
        else ["Subject", "Year", "Kind", "Score", "Max"]
    )
    xs = [72, 250, 340, 400, 460]
    for i, h in enumerate(headers):
        c.drawString(xs[i], y, h)
    y -= 14
    c.setFont("Helvetica", 9)
    if not grades.exists():
        c.drawString(72, y, "—" if locale.startswith("fr") else "No published grades.")
    for g in grades[:80]:
        if y < 72:
            c.showPage()
            y = height - 72
            c.setFont("Helvetica", 9)
        score = f"{g.score}" if g.score is not None else g.entry_status
        row = [
            (g.subject.name if g.subject_id else "—")[:40],
            g.academic_year.name if g.academic_year_id else "—",
            g.kind,
            str(score),
            str(g.max_score),
        ]
        for i, val in enumerate(row):
            c.drawString(xs[i], y, str(val)[:28])
        y -= 12

    y -= 20
    c.setFont("Helvetica", 8)
    today = timezone.localdate().strftime("%d/%m/%Y")
    c.drawString(72, y, f"Abidjan · {today} · IUA Digital Campus")
    _stamp_verify_qr(c, profile, "transcript", locale)
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
    return _pdf_response(pdf, f"attestation-{profile.student_number}-{locale}.pdf")


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_transcript_pdf(request):
    profile = _student_or_403(request.user)
    if not profile:
        return Response({"detail": "Profil étudiant requis."}, status=403)
    locale = (request.query_params.get("lang") or "fr").lower()
    pdf = _build_transcript_pdf(profile, locale=locale)
    return _pdf_response(pdf, f"releve-{profile.student_number}-{locale}.pdf")


def _build_admission_letter_pdf(profile: StudentProfile, locale: str = "fr") -> bytes:
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    width, height = A4
    y = height - 72
    title = "LETTRE D'ADMISSION" if locale.startswith("fr") else "ADMISSION LETTER"
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(width / 2, y, "Institut Universitaire d'Abidjan")
    y -= 28
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(width / 2, y, title)
    y -= 48
    c.setFont("Helvetica", 11)
    program = profile.program.name if profile.program_id else "—"
    today = timezone.localdate().strftime("%d/%m/%Y")
    if locale.startswith("fr"):
        lines = [
            f"Madame, Monsieur {profile.user.full_name},",
            "",
            f"Nous avons le plaisir de confirmer votre admission",
            f"à l'IUA pour la formation : {program}.",
            f"Matricule : {profile.student_number}",
            f"Niveau : {profile.level or '—'}",
            "",
            f"Fait à Abidjan, le {today}.",
            "",
            "Document généré électroniquement — IUA Digital Campus.",
        ]
    else:
        lines = [
            f"Dear {profile.user.full_name},",
            "",
            f"We are pleased to confirm your admission",
            f"to IUA for the program: {program}.",
            f"Student ID: {profile.student_number}",
            f"Level: {profile.level or '—'}",
            "",
            f"Issued in Abidjan on {today}.",
            "",
            "Electronically generated — IUA Digital Campus.",
        ]
    for line in lines:
        c.drawString(72, y, line)
        y -= 18
    _stamp_verify_qr(c, profile, "admission_letter", locale)
    c.showPage()
    c.save()
    return buf.getvalue()


def _build_equivalence_pdf(profile: StudentProfile, locale: str = "fr") -> bytes:
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    width, height = A4
    y = height - 72
    title = "ATTESTATION D'ÉQUIVALENCE" if locale.startswith("fr") else "EQUIVALENCE CERTIFICATE"
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(width / 2, y, "Institut Universitaire d'Abidjan")
    y -= 28
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(width / 2, y, title)
    y -= 48
    c.setFont("Helvetica", 11)
    today = timezone.localdate().strftime("%d/%m/%Y")
    program = profile.program.name if profile.program_id else "—"
    if locale.startswith("fr"):
        lines = [
            f"Certifie que {profile.user.full_name} ({profile.student_number})",
            f"suit le programme {program}.",
            "Cette attestation peut accompagner une demande d'équivalence",
            "auprès d'établissements partenaires.",
            "",
            f"Fait à Abidjan, le {today}.",
        ]
    else:
        lines = [
            f"Certifies that {profile.user.full_name} ({profile.student_number})",
            f"is enrolled in {program}.",
            "This certificate may support an equivalence request",
            "with partner institutions.",
            "",
            f"Issued in Abidjan on {today}.",
        ]
    for line in lines:
        c.drawString(72, y, line)
        y -= 18
    _stamp_verify_qr(c, profile, "equivalence", locale)
    c.showPage()
    c.save()
    return buf.getvalue()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_admission_letter_pdf(request):
    profile = _student_or_403(request.user)
    if not profile:
        return Response({"detail": "Profil étudiant requis."}, status=403)
    locale = (request.query_params.get("lang") or "fr").lower()
    pdf = _build_admission_letter_pdf(profile, locale=locale)
    return _pdf_response(pdf, f"admission-{profile.student_number}-{locale}.pdf")


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_equivalence_pdf(request):
    profile = _student_or_403(request.user)
    if not profile:
        return Response({"detail": "Profil étudiant requis."}, status=403)
    locale = (request.query_params.get("lang") or "fr").lower()
    pdf = _build_equivalence_pdf(profile, locale=locale)
    return _pdf_response(pdf, f"equivalence-{profile.student_number}-{locale}.pdf")
