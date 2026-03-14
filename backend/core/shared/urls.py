from django.urls import path, include
from .views import PublicHealthView
from rest_framework.routers import DefaultRouter
from .views import SchoolViewSet

router = DefaultRouter()
router.register("schools", SchoolViewSet, basename="schools")

urlpatterns = [
    path("health/", PublicHealthView.as_view()),
    path("", include(router.urls)),
]
