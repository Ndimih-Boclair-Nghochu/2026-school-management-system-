from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from core.models import AttendanceRecord
from .serializers import AttendanceRecordSerializer


class AttendanceRecordViewSet(ModelViewSet):
    queryset = AttendanceRecord.objects.select_related("student", "section", "recorded_by").all().order_by("-date")
    serializer_class = AttendanceRecordSerializer
    permission_classes = [IsAuthenticated]
