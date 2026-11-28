from django.contrib import admin

from apps.teaching.models import (
    AttendanceRecord,
    AttendanceSession,
    CatchUpRequest,
    ClassAnnouncement,
    CourseMaterial,
    GradeScheme,
    GradeSheetSignature,
    HomeworkAssignment,
    HomeworkSubmission,
    Quiz,
    QuizAttempt,
    QuizQuestion,
    ScheduleSlot,
    TeachingEvaluation,
    VideoMeeting,
)

admin.site.register(GradeScheme)
admin.site.register(AttendanceSession)
admin.site.register(AttendanceRecord)
admin.site.register(ScheduleSlot)
admin.site.register(CourseMaterial)
admin.site.register(HomeworkAssignment)
admin.site.register(HomeworkSubmission)
admin.site.register(ClassAnnouncement)
admin.site.register(Quiz)
admin.site.register(QuizQuestion)
admin.site.register(QuizAttempt)
admin.site.register(VideoMeeting)
admin.site.register(CatchUpRequest)
admin.site.register(TeachingEvaluation)
admin.site.register(GradeSheetSignature)
