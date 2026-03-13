from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import AcademicYearViewSet, SchoolClassViewSet, SectionViewSet, TermViewSet, SequenceViewSet, ResultViewSet, AssignmentViewSet, AssignmentSubmissionViewSet, OnlineClassViewSet, MaterialViewSet

router = DefaultRouter()
router.register("academic-years", AcademicYearViewSet, basename="academic-years")
router.register("classes", SchoolClassViewSet, basename="classes")
router.register("sections", SectionViewSet, basename="sections")
router.register("terms", TermViewSet, basename="terms")
router.register("sequences", SequenceViewSet, basename="sequences")
router.register("results", ResultViewSet, basename="results")
router.register("assignments", AssignmentViewSet, basename="assignments")
router.register("assignment-submissions", AssignmentSubmissionViewSet, basename="assignment-submissions")
router.register("online-classes", OnlineClassViewSet, basename="online-classes")
router.register("materials", MaterialViewSet, basename="materials")

urlpatterns = [
    path("", include(router.urls)),
]
