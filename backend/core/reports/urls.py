from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import ReportSnapshotViewSet

router = DefaultRouter()
router.register("snapshots", ReportSnapshotViewSet, basename="report-snapshots")

urlpatterns = [
    path("", include(router.urls)),
]
