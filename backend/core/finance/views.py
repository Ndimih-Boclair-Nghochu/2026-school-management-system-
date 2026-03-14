from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from rest_framework import serializers
from core.models import Invoice, Payment, FeeStructure, ReportSnapshot, Notification
from .serializers import InvoiceSerializer, PaymentSerializer

class InvoiceViewSet(ModelViewSet):
    queryset = Invoice.objects.select_related("student").all().order_by("-id")
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

class FeeStructureSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeStructure
        fields = '__all__'

class FeeStructureViewSet(ModelViewSet):
    queryset = FeeStructure.objects.select_related("school_class", "academic_year").all().order_by("school_class")
    serializer_class = FeeStructureSerializer
    permission_classes = [IsAuthenticated]

class ReportSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportSnapshot
        fields = '__all__'

class ReportSnapshotViewSet(ModelViewSet):
    queryset = ReportSnapshot.objects.filter(category="finance").order_by("-created_at")
    serializer_class = ReportSnapshotSerializer
    permission_classes = [IsAuthenticated]

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class NotificationViewSet(ModelViewSet):
    queryset = Notification.objects.filter(type="finance").order_by("-created_at")
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]


class PaymentViewSet(ModelViewSet):
    queryset = Payment.objects.select_related("invoice", "recorded_by").all().order_by("-date_paid")
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
