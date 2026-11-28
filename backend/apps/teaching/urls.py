from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.teaching.views import (
    AttendanceSessionViewSet,
    CatchUpRequestViewSet,
    ClassAnnouncementViewSet,
    CourseMaterialViewSet,
    GradeSchemeViewSet,
    GradeSheetSignatureViewSet,
    HomeworkAssignmentViewSet,
    HomeworkSubmissionViewSet,
    QuizViewSet,
    ScheduleSlotViewSet,
    TeachingEvaluationViewSet,
    VideoMeetingViewSet,
    student_pedagogical_file,
    teacher_insights,
)
from apps.teaching.student_views import (
    CareerOpportunityViewSet,
    ClubViewSet,
    ExamEventViewSet,
    InternshipViewSet,
    LibraryItemViewSet,
    ScholarshipOfferViewSet,
    StudentAnnouncementViewSet,
    StudentAttendanceViewSet,
    StudentHomeworkViewSet,
    StudentMaterialViewSet,
    StudentMeetingViewSet,
    StudentPaymentViewSet,
    StudentQuizViewSet,
    StudentScheduleViewSet,
    StudentTeacherContactViewSet,
    student_hub,
)
from apps.teaching.calendar_views import unified_calendar, unified_calendar_ics
from apps.teaching.payment_views import payment_confirm, payment_webhook
from apps.teaching.ops_views import (
    AuditEventViewSet,
    CampusAnnouncementViewSet,
    MobilityPartnerViewSet,
    OpsCohortViewSet,
    OpsExamsViewSet,
    OpsInternshipsViewSet,
    OpsPaymentsViewSet,
    OpsScheduleViewSet,
    OpsScholarshipsViewSet,
    OpsStudentCardsViewSet,
    direction_hub,
    direction_institution,
    direction_performance,
    direction_pv,
    direction_quality,
    ops_attendance_export,
    ops_hub,
    ops_import_students_preview,
    ops_queue,
)

router = DefaultRouter()
router.register(r"grade-schemes", GradeSchemeViewSet, basename="grade-schemes")
router.register(r"attendance-sessions", AttendanceSessionViewSet, basename="attendance-sessions")
router.register(r"schedule-slots", ScheduleSlotViewSet, basename="schedule-slots")
router.register(r"course-materials", CourseMaterialViewSet, basename="course-materials")
router.register(r"homeworks", HomeworkAssignmentViewSet, basename="homeworks")
router.register(r"homework-submissions", HomeworkSubmissionViewSet, basename="homework-submissions")
router.register(r"announcements", ClassAnnouncementViewSet, basename="announcements")
router.register(r"quizzes", QuizViewSet, basename="quizzes")
router.register(r"meetings", VideoMeetingViewSet, basename="meetings")
router.register(r"catchups", CatchUpRequestViewSet, basename="catchups")
router.register(r"teaching-evaluations", TeachingEvaluationViewSet, basename="teaching-evaluations")
router.register(r"grade-signatures", GradeSheetSignatureViewSet, basename="grade-signatures")

# Student portal
router.register(r"student/payments", StudentPaymentViewSet, basename="student-payments")
router.register(r"student/internships", InternshipViewSet, basename="student-internships")
router.register(r"student/clubs", ClubViewSet, basename="student-clubs")
router.register(r"student/library", LibraryItemViewSet, basename="student-library")
router.register(r"student/careers", CareerOpportunityViewSet, basename="student-careers")
router.register(r"student/scholarships", ScholarshipOfferViewSet, basename="student-scholarships")
router.register(r"student/exams", ExamEventViewSet, basename="student-exams")
router.register(r"student/materials", StudentMaterialViewSet, basename="student-materials")
router.register(r"student/homeworks", StudentHomeworkViewSet, basename="student-homeworks")
router.register(r"student/announcements", StudentAnnouncementViewSet, basename="student-announcements")
router.register(r"student/meetings", StudentMeetingViewSet, basename="student-meetings")
router.register(r"student/schedule", StudentScheduleViewSet, basename="student-schedule")
router.register(r"student/attendance", StudentAttendanceViewSet, basename="student-attendance")
router.register(r"student/quizzes", StudentQuizViewSet, basename="student-quizzes")
router.register(r"student/contacts", StudentTeacherContactViewSet, basename="student-contacts")

# Direction / secretariat ops
router.register(r"ops/announcements", CampusAnnouncementViewSet, basename="ops-announcements")
router.register(r"ops/partners", MobilityPartnerViewSet, basename="ops-partners")
router.register(r"ops/audit", AuditEventViewSet, basename="ops-audit")
router.register(r"ops/cohorts", OpsCohortViewSet, basename="ops-cohorts")
router.register(r"ops/schedule", OpsScheduleViewSet, basename="ops-schedule")
router.register(r"ops/payments", OpsPaymentsViewSet, basename="ops-payments")
router.register(r"ops/exams", OpsExamsViewSet, basename="ops-exams")
router.register(r"ops/internships", OpsInternshipsViewSet, basename="ops-internships")
router.register(r"ops/scholarships", OpsScholarshipsViewSet, basename="ops-scholarships")
router.register(r"ops/cards", OpsStudentCardsViewSet, basename="ops-cards")

urlpatterns = [
    path("calendar/", unified_calendar, name="unified-calendar"),
    path("calendar.ics", unified_calendar_ics, name="unified-calendar-ics"),
    path("teacher/insights/", teacher_insights, name="teacher-insights"),
    path("teacher/students/<uuid:student_id>/file/", student_pedagogical_file, name="student-ped-file"),
    path("student/hub/", student_hub, name="student-hub"),
    path("direction/hub/", direction_hub, name="direction-hub"),
    path("direction/performance/", direction_performance, name="direction-performance"),
    path("direction/institution/", direction_institution, name="direction-institution"),
    path("direction/quality/", direction_quality, name="direction-quality"),
    path("direction/pv/", direction_pv, name="direction-pv"),
    path("ops/hub/", ops_hub, name="ops-hub"),
    path("ops/attendance/", ops_attendance_export, name="ops-attendance"),
    path("ops/import-preview/", ops_import_students_preview, name="ops-import-preview"),
    path("ops/queue/", ops_queue, name="ops-queue"),
    path("payments/webhook/", payment_webhook, name="payments-webhook"),
    path("payments/<uuid:pk>/confirm/", payment_confirm, name="payments-confirm"),
] + router.urls
