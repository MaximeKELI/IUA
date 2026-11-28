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

urlpatterns = [
    path("teacher/insights/", teacher_insights, name="teacher-insights"),
    path("teacher/students/<uuid:student_id>/file/", student_pedagogical_file, name="student-ped-file"),
    path("student/hub/", student_hub, name="student-hub"),
] + router.urls
