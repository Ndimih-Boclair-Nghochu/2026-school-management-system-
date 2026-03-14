
from django.contrib import admin
from django.urls import include, path
from core.home_view import home

urlpatterns = [
    path("", home, name="home"),
    path("admin/", admin.site.urls),
    path("api/v1/shared/", include("core.shared.urls")),
    path("api/v1/users/", include("core.users.urls")),
    path("api/v1/parents/", include("core.users.urls")),
    path("api/v1/parent-children/", include("core.users.urls")),
    path("api/v1/academics/", include("core.academics.urls")),
    path("api/v1/attendance/", include("core.attendance.urls")),
    path("api/v1/exams/", include("core.exams.urls")),
    path("api/v1/finance/", include("core.finance.urls")),
    path("api/v1/communication/", include("core.communication.urls")),
    path("api/v1/library/", include("core.library.urls")),
    path("api/v1/transport/", include("core.transport.urls")),
    path("api/v1/reports/", include("core.reports.urls")),
]
