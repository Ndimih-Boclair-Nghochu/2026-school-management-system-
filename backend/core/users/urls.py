from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, ParentViewSet, ParentChildViewSet

router = DefaultRouter()
router.register("users", UserViewSet, basename="users")
router.register("parents", ParentViewSet, basename="parents")
router.register("parents/children", ParentChildViewSet, basename="parents-children")
router.register("parent-children", ParentChildViewSet, basename="parent-children")

urlpatterns = [
    path("", include(router.urls)),
]
