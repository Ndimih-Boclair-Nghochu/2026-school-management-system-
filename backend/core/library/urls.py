from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import BookViewSet, BorrowViewSet

router = DefaultRouter()
router.register("books", BookViewSet, basename="books")
router.register("borrows", BorrowViewSet, basename="borrows")

urlpatterns = [
    path("", include(router.urls)),
]
