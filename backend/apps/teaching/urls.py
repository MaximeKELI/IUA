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

urlpatterns = [
    path("teacher/insights/", teacher_insights, name="teacher-insights"),
    path("teacher/students/<uuid:student_id>/file/", student_pedagogical_file, name="student-ped-file"),
] + router.urls
