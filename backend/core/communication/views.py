from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from core.models import Announcement
from .serializers import AnnouncementSerializer

class AnnouncementViewSet(ModelViewSet):
    queryset = Announcement.objects.select_related("created_by").all().order_by("-created_at")
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated]
