from django.urls import path
from .views import PublicHealthView, PublicRootView

urlpatterns = [
    path("", PublicRootView.as_view(), name="public-root"),
    path("health/", PublicHealthView.as_view(), name="public-health"),
]
