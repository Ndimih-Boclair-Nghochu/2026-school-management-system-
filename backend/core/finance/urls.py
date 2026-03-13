from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import InvoiceViewSet, PaymentViewSet, FeeStructureViewSet, ReportSnapshotViewSet, NotificationViewSet

router = DefaultRouter()
router.register("invoices", InvoiceViewSet, basename="invoices")
router.register("payments", PaymentViewSet, basename="payments")
router.register("fee-structures", FeeStructureViewSet, basename="fee-structures")
router.register("reports", ReportSnapshotViewSet, basename="finance-reports")
router.register("notifications", NotificationViewSet, basename="finance-notifications")

urlpatterns = [
    path("", include(router.urls)),
]
