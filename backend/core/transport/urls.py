from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import RouteViewSet, TransportAssignmentViewSet

router = DefaultRouter()
router.register("routes", RouteViewSet, basename="routes")
router.register("assignments", TransportAssignmentViewSet, basename="transport-assignments")

urlpatterns = [
    path("", include(router.urls)),
]
