from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from core.users.models import Parent, ParentChild
from core.users.serializers import ParentSerializer, ParentChildSerializer
from rest_framework.permissions import IsAuthenticated
from core.academics.models import Result
from core.models import AttendanceRecord, Invoice, Payment, Announcement, Notification
from core.users.serializers import UserSerializer
class ParentViewSet(ModelViewSet):
    queryset = Parent.objects.select_related("user", "school").all()
    serializer_class = ParentSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=["get"], url_path="children")
    def children(self, request, pk=None):
        parent = self.get_object()
        children = ParentChild.objects.filter(parent=parent).select_related("student")
        data = [UserSerializer(child.student.user).data for child in children]
        return Response(data)

    @action(detail=True, methods=["get"], url_path="child-results")
    def child_results(self, request, pk=None):
        parent = self.get_object()
        children = ParentChild.objects.filter(parent=parent).select_related("student")
        results = Result.objects.filter(student__in=[c.student for c in children])
        from core.academics.serializers import ResultSerializer
        return Response(ResultSerializer(results, many=True).data)

    @action(detail=True, methods=["get"], url_path="child-attendance")
    def child_attendance(self, request, pk=None):
        parent = self.get_object()
        children = ParentChild.objects.filter(parent=parent).select_related("student")
        attendance = AttendanceRecord.objects.filter(student__in=[c.student for c in children])
        from core.attendance.serializers import AttendanceRecordSerializer
        return Response(AttendanceRecordSerializer(attendance, many=True).data)

    @action(detail=True, methods=["get"], url_path="child-invoices")
    def child_invoices(self, request, pk=None):
        parent = self.get_object()
        children = ParentChild.objects.filter(parent=parent).select_related("student")
        invoices = Invoice.objects.filter(student__in=[c.student for c in children])
        from core.models import Invoice
        from rest_framework import serializers
        class InvoiceSerializer(serializers.ModelSerializer):
            class Meta:
                model = Invoice
                fields = '__all__'
        return Response(InvoiceSerializer(invoices, many=True).data)

    @action(detail=True, methods=["get"], url_path="child-payments")
    def child_payments(self, request, pk=None):
        parent = self.get_object()
        children = ParentChild.objects.filter(parent=parent).select_related("student")
        payments = Payment.objects.filter(student__in=[c.student for c in children])
        from core.models import Payment
        from rest_framework import serializers
        class PaymentSerializer(serializers.ModelSerializer):
            class Meta:
                model = Payment
                fields = '__all__'
        return Response(PaymentSerializer(payments, many=True).data)

    @action(detail=True, methods=["get"], url_path="child-announcements")
    def child_announcements(self, request, pk=None):
        parent = self.get_object()
        children = ParentChild.objects.filter(parent=parent).select_related("student")
        school_classes = [c.student.school_class for c in children if hasattr(c.student, 'school_class')]
        announcements = Announcement.objects.filter(school_class__in=school_classes)
        from core.models import Announcement
        from rest_framework import serializers
        class AnnouncementSerializer(serializers.ModelSerializer):
            class Meta:
                model = Announcement
                fields = '__all__'
        return Response(AnnouncementSerializer(announcements, many=True).data)

    @action(detail=True, methods=["get"], url_path="child-notifications")
    def child_notifications(self, request, pk=None):
        parent = self.get_object()
        children = ParentChild.objects.filter(parent=parent).select_related("student")
        users = [c.student.user for c in children if hasattr(c.student, 'user')]
        notifications = Notification.objects.filter(user__in=users)
        from core.models import Notification
        from rest_framework import serializers
        class NotificationSerializer(serializers.ModelSerializer):
            class Meta:
                model = Notification
                fields = '__all__'
        return Response(NotificationSerializer(notifications, many=True).data)
class ParentChildViewSet(ModelViewSet):
    queryset = ParentChild.objects.all()
    serializer_class = ParentChildSerializer
    permission_classes = [IsAuthenticated]
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from core.users.models import User, Parent, ParentChild
from .serializers import UserSerializer, ParentSerializer, ParentChildSerializer


class UserViewSet(ModelViewSet):
    class ParentViewSet(ModelViewSet):
        queryset = Parent.objects.select_related("user", "school").all()
        serializer_class = ParentSerializer
        permission_classes = [IsAuthenticated]

    class ParentChildViewSet(ModelViewSet):
        queryset = ParentChild.objects.select_related("parent", "student").all()
        serializer_class = ParentChildSerializer
        permission_classes = [IsAuthenticated]
    queryset = User.objects.all().order_by("username")
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
