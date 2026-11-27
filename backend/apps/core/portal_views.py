from django.db.models import Avg, Count, Q
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.academic.models import (
    AdminRequest,
    Enrollment,
    Faculty,
    Grade,
    Program,
    StaffProfile,
    StudentProfile,
    TeachingAssignment,
)
from apps.core.cache import cache_key, cached_value
from apps.identity.models import User
from apps.notifications.models import Notification


class StudentDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.has_role("student") and not request.user.is_superuser:
            return Response({"code": "forbidden", "message": "Accès réservé aux étudiants."}, status=403)

        user_id = str(request.user.id)

        def build():
            from apps.academic.models import Subject

            profile = (
                StudentProfile.objects.filter(user_id=request.user.id)
                .select_related("program", "cohort")
                .first()
            )
            enrollments_qs = (
                Enrollment.objects.filter(student__user_id=request.user.id)
                .select_related("program", "cohort", "academic_year")
                .order_by("-created_at")
            )
            enrollments = list(enrollments_qs)
            active_enrollments = [e for e in enrollments if e.status == "active"]
            latest = active_enrollments[0] if active_enrollments else (enrollments[0] if enrollments else None)
            program_name = getattr(getattr(profile, "program", None), "name", None)
            program_code = getattr(getattr(profile, "program", None), "code", None)
            cohort_name = getattr(getattr(profile, "cohort", None), "name", None)
            if not program_name and latest:
                program_name = latest.program.name
                program_code = latest.program.code
            if not cohort_name and latest:
                cohort_name = latest.cohort.name
            # Heal profile drift from enrollment
            if profile and latest:
                dirty = []
                if not profile.program_id and latest.program_id:
                    profile.program_id = latest.program_id
                    dirty.append("program_id")
                if not profile.cohort_id and latest.cohort_id:
                    profile.cohort_id = latest.cohort_id
                    dirty.append("cohort_id")
                if dirty:
                    profile.save(update_fields=[*dirty, "updated_at"])

            program_id = getattr(profile, "program_id", None) or (
                latest.program_id if latest else None
            )
            grades_qs = Grade.objects.filter(
                student__user_id=request.user.id, is_published=True
            ).select_related("subject", "academic_year")
            grades_list = list(grades_qs.order_by("-created_at"))
            grades_count = len(grades_list)

            # Average on /20 scale
            avg_score = None
            if grades_list:
                ratios = [
                    float(g.score) / float(g.max_score) * 20
                    for g in grades_list
                    if g.max_score and float(g.max_score) > 0
                ]
                if ratios:
                    avg_score = round(sum(ratios) / len(ratios), 2)

            grade_stats_by_subject: dict[str, dict] = {}
            for g in grades_list:
                sid = str(g.subject_id)
                bucket = grade_stats_by_subject.setdefault(
                    sid, {"count": 0, "ratios": [], "latest_label": None, "latest_score": None}
                )
                bucket["count"] += 1
                if g.max_score and float(g.max_score) > 0:
                    bucket["ratios"].append(float(g.score) / float(g.max_score) * 20)
                if bucket["latest_label"] is None:
                    bucket["latest_label"] = g.label or g.kind
                    bucket["latest_score"] = f"{g.score}/{g.max_score}"

            subjects_payload = []
            if program_id:
                subjects = list(
                    Subject.objects.filter(course_unit__program_id=program_id)
                    .select_related("course_unit")
                    .order_by("course_unit__semester", "code")
                )
                teacher_by_subject: dict[str, str] = {}
                for ta in (
                    TeachingAssignment.objects.filter(subject_id__in=[s.id for s in subjects])
                    .select_related("teacher__user")
                ):
                    name = f"{ta.teacher.user.first_name} {ta.teacher.user.last_name}".strip()
                    if name:
                        teacher_by_subject[str(ta.subject_id)] = name
                for s in subjects:
                    stats = grade_stats_by_subject.get(str(s.id), {})
                    ratios = stats.get("ratios") or []
                    subjects_payload.append(
                        {
                            "id": str(s.id),
                            "name": s.name,
                            "code": s.code,
                            "hours": s.hours,
                            "coefficient": str(s.coefficient),
                            "semester": s.course_unit.semester,
                            "ue_code": s.course_unit.code,
                            "ue_name": s.course_unit.name,
                            "credits": str(s.course_unit.credits),
                            "teacher": teacher_by_subject.get(str(s.id), "").strip() or None,
                            "grades_count": stats.get("count", 0),
                            "avg_score": round(sum(ratios) / len(ratios), 2) if ratios else None,
                            "latest_grade": stats.get("latest_score"),
                            "latest_label": stats.get("latest_label"),
                        }
                    )

            pending_requests = AdminRequest.objects.filter(
                requester_id=request.user.id, status__in=["pending", "in_progress"]
            ).count()
            unread = Notification.objects.filter(
                recipient_id=request.user.id, is_read=False
            ).count()

            recent_grades = [
                {
                    "id": str(g.id),
                    "score": str(g.score),
                    "max_score": str(g.max_score),
                    "label": g.label or g.kind,
                    "kind": g.kind,
                    "subject": g.subject.name,
                    "subject_code": g.subject.code,
                    "created_at": g.created_at.isoformat(),
                }
                for g in grades_list[:8]
            ]

            return {
                "role": "student",
                "full_name": request.user.full_name,
                "profile": {
                    "student_number": getattr(profile, "student_number", None),
                    "program": program_name,
                    "program_code": program_code,
                    "program_id": str(program_id) if program_id else None,
                    "cohort": cohort_name,
                    "level": getattr(profile, "level", None),
                    "status": getattr(profile, "status", None),
                    "email": request.user.email,
                },
                "enrollments_count": len(active_enrollments),
                "enrollments": [
                    {
                        "id": str(e.id),
                        "status": e.status,
                        "program": e.program.name,
                        "program_code": e.program.code,
                        "cohort": e.cohort.name,
                        "academic_year": e.academic_year.name,
                        "enrolled_at": e.enrolled_at.isoformat() if e.enrolled_at else None,
                    }
                    for e in enrollments[:10]
                ],
                "grades_count": grades_count,
                "avg_score": avg_score,
                "subjects_count": len(subjects_payload),
                "pending_requests": pending_requests,
                "unread_notifications": unread,
                "subjects": subjects_payload,
                "recent_grades": recent_grades,
                "modules": [
                    {"code": "01", "name": "Portail étudiant", "status": "active"},
                    {"code": "07", "name": "Notes", "status": "active"},
                    {"code": "08", "name": "Demandes admin.", "status": "active"},
                    {"code": "04", "name": "Finance", "status": "planned"},
                    {"code": "05", "name": "LMS", "status": "planned"},
                ],
            }

        payload = cached_value(cache_key("portal", "student", user_id), build, timeout=15)
        return Response(payload)


class TeacherDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.has_role("teacher") and not request.user.is_superuser:
            return Response({"code": "forbidden", "message": "Accès réservé aux enseignants."}, status=403)

        user_id = str(request.user.id)

        def build():
            assignments_qs = (
                TeachingAssignment.objects.filter(teacher__user_id=request.user.id)
                .select_related(
                    "subject__course_unit__program",
                    "academic_year",
                    "cohort",
                    "teacher__faculty",
                    "teacher__department",
                )
            )
            assignments = list(assignments_qs)
            subject_ids = [a.subject_id for a in assignments]
            program_ids = [
                a.subject.course_unit.program_id
                for a in assignments
                if a.subject.course_unit_id
            ]
            grades_qs = Grade.objects.filter(
                recorded_by_id=request.user.id
            ) | Grade.objects.filter(subject_id__in=subject_ids)
            grades_qs = grades_qs.distinct()

            students_by_program: dict[str, int] = {}
            if program_ids:
                for row in (
                    StudentProfile.objects.filter(program_id__in=program_ids)
                    .values("program_id")
                    .annotate(c=Count("id"))
                ):
                    students_by_program[str(row["program_id"])] = row["c"]

            grade_stats_by_subject: dict[str, dict] = {}
            if subject_ids:
                for row in (
                    grades_qs.filter(subject_id__in=subject_ids)
                    .values("subject_id")
                    .annotate(
                        total=Count("id"),
                        drafts=Count("id", filter=Q(is_published=False)),
                        graded_students=Count("student_id", distinct=True),
                        avg_score=Avg("score"),
                    )
                ):
                    grade_stats_by_subject[str(row["subject_id"])] = row

            students_count = (
                StudentProfile.objects.filter(
                    Q(program_id__in=program_ids)
                    | Q(
                        id__in=Enrollment.objects.filter(
                            program_id__in=program_ids, status="active"
                        ).values_list("student_id", flat=True)
                    )
                )
                .distinct()
                .count()
                if program_ids
                else 0
            )
            recent = list(
                grades_qs.select_related("student__user", "subject")
                .order_by("-created_at")[:8]
                .values(
                    "id",
                    "score",
                    "max_score",
                    "label",
                    "kind",
                    "is_published",
                    "subject__name",
                    "student__user__first_name",
                    "student__user__last_name",
                    "created_at",
                )
            )
            staff = (
                StaffProfile.objects.filter(user_id=request.user.id)
                .select_related("faculty", "department")
                .first()
            )
            unread = Notification.objects.filter(
                recipient_id=request.user.id, is_read=False
            ).count()

            subjects = []
            for a in assignments:
                program_id = (
                    str(a.subject.course_unit.program_id)
                    if a.subject.course_unit_id
                    else None
                )
                stats = grade_stats_by_subject.get(str(a.subject_id), {})
                cohort_students = students_by_program.get(program_id or "", 0)
                graded = stats.get("graded_students", 0) or 0
                subjects.append(
                    {
                        "id": str(a.subject_id),
                        "name": a.subject.name,
                        "code": a.subject.code,
                        "program": a.subject.course_unit.program.name
                        if a.subject.course_unit_id
                        else None,
                        "program_id": program_id,
                        "year": a.academic_year.name,
                        "cohort": a.cohort.name if a.cohort_id else None,
                        "hours": a.subject.hours,
                        "students_count": cohort_students,
                        "grades_count": stats.get("total", 0) or 0,
                        "drafts_count": stats.get("drafts", 0) or 0,
                        "graded_students": graded,
                        "coverage_pct": round((graded / cohort_students) * 100)
                        if cohort_students
                        else 0,
                        "avg_score": (
                            round(float(stats["avg_score"]), 2)
                            if stats.get("avg_score") is not None
                            else None
                        ),
                    }
                )

            return {
                "role": "teacher",
                "full_name": request.user.full_name,
                "title": getattr(staff, "title", "") or "",
                "profile": {
                    "staff_number": getattr(staff, "staff_number", None),
                    "staff_type": getattr(staff, "staff_type", None),
                    "title": getattr(staff, "title", "") or "",
                    "faculty": getattr(getattr(staff, "faculty", None), "name", None),
                    "department": getattr(
                        getattr(staff, "department", None), "name", None
                    ),
                },
                "assignments_count": len(assignments),
                "students_count": students_count,
                "grades_count": grades_qs.count(),
                "drafts_count": grades_qs.filter(is_published=False).count(),
                "unread_notifications": unread,
                "subjects": subjects,
                "recent_grades": [
                    {
                        "id": str(r["id"]),
                        "score": str(r["score"]),
                        "max_score": str(r["max_score"]),
                        "label": r["label"] or r["kind"],
                        "is_published": r["is_published"],
                        "subject": r["subject__name"],
                        "student": f"{r['student__user__first_name']} {r['student__user__last_name']}".strip(),
                        "created_at": r["created_at"].isoformat(),
                    }
                    for r in recent
                ],
            }

        payload = cached_value(cache_key("portal", "teacher", user_id), build, timeout=15)
        return Response(payload)


class AdminDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (
            request.user.has_any_role(
                "admin", "super_admin", "academic_dir", "direction", "secretariat"
            )
            or request.user.is_superuser
        ):
            return Response({"code": "forbidden", "message": "Accès réservé à l'administration."}, status=403)

        def build():
            return {
                "role": "admin",
                "stats": {
                    "users": User.objects.filter(is_active=True).count(),
                    "students": StudentProfile.objects.count(),
                    "faculties": Faculty.objects.count(),
                    "programs": Program.objects.count(),
                    "enrollments": Enrollment.objects.count(),
                },
            }

        payload = cached_value(cache_key("portal", "admin", "stats"), build, timeout=30)
        return Response(payload)


class DirectionDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (
            request.user.has_any_role(
                "direction",
                "super_admin",
                "academic_dir",
                "finance_dir",
                "admin",
            )
            or request.user.is_superuser
        ):
            return Response({"code": "forbidden", "message": "Accès réservé à la direction."}, status=403)

        def build():
            by_faculty = list(
                StudentProfile.objects.values("program__faculty__name")
                .annotate(total=Count("id"))
                .order_by("-total")[:50]
            )
            pending_requests = AdminRequest.objects.filter(status="pending").count()
            recent_requests = list(
                AdminRequest.objects.select_related("requester")
                .order_by("-created_at")[:8]
                .values("id", "subject", "status", "kind", "requester__first_name", "requester__last_name")
            )
            return {
                "role": "direction",
                "kpis": {
                    "students": StudentProfile.objects.count(),
                    "teachers": User.objects.filter(
                        user_roles__role__code="teacher", user_roles__is_active=True
                    )
                    .distinct()
                    .count(),
                    "faculties": Faculty.objects.count(),
                    "programs": Program.objects.count(),
                    "enrollments": Enrollment.objects.count(),
                    "pending_requests": pending_requests,
                    "grades_published": Grade.objects.filter(is_published=True).count(),
                    "teaching_assignments": TeachingAssignment.objects.count(),
                },
                "students_by_faculty": [
                    {
                        "faculty": row["program__faculty__name"] or "Non affecté",
                        "total": row["total"],
                    }
                    for row in by_faculty
                ],
                "recent_requests": [
                    {
                        "id": str(r["id"]),
                        "subject": r["subject"],
                        "status": r["status"],
                        "kind": r["kind"],
                        "requester": f"{r['requester__first_name']} {r['requester__last_name']}".strip(),
                    }
                    for r in recent_requests
                ],
                "capabilities": {
                    "can_manage_users": True,
                    "can_manage_programs": True,
                    "can_manage_enrollments": True,
                    "can_manage_requests": True,
                    "can_view_grades": True,
                    "can_edit_grades": False,
                    "can_view_teaching": True,
                    "can_edit_teaching": False,
                    "can_see_student_ids": False,
                },
                "note": "Vous gérez l’établissement. Notes et cours : consultation. Matricules étudiants masqués.",
            }

        payload = cached_value(cache_key("portal", "direction", "kpis"), build, timeout=15)
        return Response(payload)
