"""Unified calendar (EDT + exams + homework) + ICS export."""

from __future__ import annotations

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from django.http import HttpResponse
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.academic.models import StudentProfile, StaffProfile, TeachingAssignment
from apps.teaching.models import HomeworkAssignment, ScheduleSlot
from apps.teaching.student_models import ExamEvent

ABIDJAN = ZoneInfo("Africa/Abidjan")


def _ics_escape(text: str) -> str:
    return (
        (text or "")
        .replace("\\", "\\\\")
        .replace(";", "\\;")
        .replace(",", "\\,")
        .replace("\n", "\\n")
    )


def _fmt_ics(dt: datetime) -> str:
    if timezone.is_naive(dt):
        dt = timezone.make_aware(dt, ABIDJAN)
    return dt.astimezone(ABIDJAN).strftime("%Y%m%dT%H%M%S")


def _student_profile(user):
    return StudentProfile.objects.select_related("program", "cohort").filter(user=user).first()


def _staff_profile(user):
    return StaffProfile.objects.filter(user=user).first()


def _collect_events(user, weeks: int = 8) -> list[dict]:
    now = timezone.now().astimezone(ABIDJAN)
    end = now + timedelta(weeks=weeks)
    events: list[dict] = []

    student = _student_profile(user)
    staff = _staff_profile(user)

    # Schedule slots → next N weeks of occurrences
    slots = ScheduleSlot.objects.none()
    if student and student.program_id:
        subject_ids = TeachingAssignment.objects.filter(
            subject__course_unit__program_id=student.program_id
        ).values_list("subject_id", flat=True)
        slots = ScheduleSlot.objects.filter(
            is_active=True, subject_id__in=subject_ids
        ).select_related("subject")
    elif staff:
        slots = ScheduleSlot.objects.filter(
            is_active=True, teacher=staff
        ).select_related("subject")

    for slot in slots:
        # Find next occurrence of weekday from today
        days_ahead = (slot.weekday - now.weekday()) % 7
        first = (now + timedelta(days=days_ahead)).date()
        for w in range(weeks):
            day = first + timedelta(weeks=w)
            start = datetime.combine(day, slot.start_time, tzinfo=ABIDJAN)
            finish = datetime.combine(day, slot.end_time, tzinfo=ABIDJAN)
            if finish < now or start > end:
                continue
            events.append(
                {
                    "id": f"slot-{slot.id}-{day.isoformat()}",
                    "kind": "schedule",
                    "title": slot.subject.name if slot.subject_id else "Cours",
                    "starts_at": start.isoformat(),
                    "ends_at": finish.isoformat(),
                    "location": slot.room or "",
                    "description": slot.subject.code if slot.subject_id else "",
                }
            )

    # Exams
    from django.db.models import Q

    exams = ExamEvent.objects.filter(starts_at__gte=now - timedelta(days=1), starts_at__lte=end)
    if student:
        q = Q(student=student)
        code = getattr(student.program, "code", None) if student.program_id else None
        if code:
            q |= Q(student__isnull=True, program_code=code)
        exams = exams.filter(q)
    elif not staff:
        exams = ExamEvent.objects.none()
    for ex in exams[:200]:
        events.append(
            {
                "id": f"exam-{ex.id}",
                "kind": "exam",
                "title": ex.title,
                "starts_at": ex.starts_at.isoformat(),
                "ends_at": (ex.starts_at + timedelta(hours=2)).isoformat(),
                "location": ex.room or "",
                "description": ex.subject_name or ex.notes or "",
            }
        )

    # Homework deadlines
    homeworks = HomeworkAssignment.objects.filter(
        is_published=True, due_at__gte=now - timedelta(days=1), due_at__lte=end
    ).select_related("subject")
    if student and student.program_id:
        homeworks = homeworks.filter(subject__course_unit__program_id=student.program_id)
    elif staff:
        homeworks = homeworks.filter(teacher=staff)
    for hw in homeworks[:200]:
        events.append(
            {
                "id": f"hw-{hw.id}",
                "kind": "homework",
                "title": f"Devoir — {hw.title}",
                "starts_at": hw.due_at.isoformat(),
                "ends_at": hw.due_at.isoformat(),
                "location": "",
                "description": hw.subject.name if hw.subject_id else "",
            }
        )

    events.sort(key=lambda e: e["starts_at"])
    return events


def _to_ics(events: list[dict]) -> str:
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//IUA Digital Campus//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:IUA Campus",
    ]
    for ev in events:
        start = datetime.fromisoformat(ev["starts_at"])
        end = datetime.fromisoformat(ev["ends_at"])
        lines.extend(
            [
                "BEGIN:VEVENT",
                f"UID:{_ics_escape(ev['id'])}@iua.ci",
                f"DTSTAMP:{_fmt_ics(timezone.now())}",
                f"DTSTART:{_fmt_ics(start)}",
                f"DTEND:{_fmt_ics(end)}",
                f"SUMMARY:{_ics_escape(ev['title'])}",
                f"LOCATION:{_ics_escape(ev.get('location') or '')}",
                f"DESCRIPTION:{_ics_escape(ev.get('description') or '')}",
                "END:VEVENT",
            ]
        )
    lines.append("END:VCALENDAR")
    return "\r\n".join(lines) + "\r\n"


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def unified_calendar(request):
    weeks = min(16, max(1, int(request.query_params.get("weeks") or 8)))
    events = _collect_events(request.user, weeks=weeks)
    return Response({"events": events, "count": len(events)})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def unified_calendar_ics(request):
    weeks = min(16, max(1, int(request.query_params.get("weeks") or 8)))
    events = _collect_events(request.user, weeks=weeks)
    ics = _to_ics(events)
    response = HttpResponse(ics, content_type="text/calendar; charset=utf-8")
    response["Content-Disposition"] = 'attachment; filename="iua-campus.ics"'
    return response
