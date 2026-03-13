from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health(_request):
    return JsonResponse({"status": "ok", "scope": "public"})

def root(_request):
    return JsonResponse({"message": "Welcome to the School Management System public API root."})


urlpatterns = [
    path("", root),
    path("admin/", admin.site.urls),
    path("health/", health),
    path("api/public/shared/", include("core.shared.urls")),
    path("api/public/", include("core.shared.urls_public")),
]
