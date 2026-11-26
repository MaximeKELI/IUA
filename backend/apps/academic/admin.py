from django.contrib import admin

from apps.academic import models

for model in [
    models.Institution,
    models.Faculty,
    models.Department,
    models.Program,
    models.AcademicYear,
    models.Cohort,
    models.CourseUnit,
    models.Subject,
    models.Building,
    models.Room,
    models.StudentProfile,
    models.StaffProfile,
    models.Enrollment,
    models.TeachingAssignment,
]:
    admin.site.register(model)
