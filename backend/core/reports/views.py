from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from core.models import ReportSnapshot
from .serializers import ReportSnapshotSerializer


class ReportSnapshotViewSet(ModelViewSet):
    queryset = ReportSnapshot.objects.select_related("generated_by").all().order_by("-created_at")
    serializer_class = ReportSnapshotSerializer
    permission_classes = [IsAuthenticated]
