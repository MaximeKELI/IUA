from rest_framework.routers import DefaultRouter

from apps.academic.views import (
    AcademicYearViewSet,
    AdminRequestViewSet,
    CohortViewSet,
    CourseUnitViewSet,
    DepartmentViewSet,
    EnrollmentViewSet,
    FacultyViewSet,
    GradeViewSet,
    InstitutionViewSet,
    ProgramViewSet,
    StaffProfileViewSet,
    StudentProfileViewSet,
    SubjectViewSet,
    TeachingAssignmentViewSet,
)

router = DefaultRouter()
router.register(r"institutions", InstitutionViewSet, basename="institutions")
router.register(r"faculties", FacultyViewSet, basename="faculties")
router.register(r"departments", DepartmentViewSet, basename="departments")
router.register(r"programs", ProgramViewSet, basename="programs")
router.register(r"academic-years", AcademicYearViewSet, basename="academic-years")
router.register(r"cohorts", CohortViewSet, basename="cohorts")
router.register(r"course-units", CourseUnitViewSet, basename="course-units")
router.register(r"subjects", SubjectViewSet, basename="subjects")
router.register(r"students", StudentProfileViewSet, basename="students")
router.register(r"staff", StaffProfileViewSet, basename="staff")
router.register(r"enrollments", EnrollmentViewSet, basename="enrollments")
router.register(r"teaching-assignments", TeachingAssignmentViewSet, basename="teaching-assignments")
router.register(r"grades", GradeViewSet, basename="grades")
router.register(r"admin-requests", AdminRequestViewSet, basename="admin-requests")

urlpatterns = router.urls
