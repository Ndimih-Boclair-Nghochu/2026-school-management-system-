from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from core.models import Exam, ExamResult
from .serializers import ExamSerializer, ExamResultSerializer


class ExamViewSet(ModelViewSet):
    queryset = Exam.objects.select_related("section").all().order_by("-date")
    serializer_class = ExamSerializer
    permission_classes = [IsAuthenticated]


class ExamResultViewSet(ModelViewSet):
    queryset = ExamResult.objects.select_related("exam", "student").all().order_by("-id")
    serializer_class = ExamResultSerializer
    permission_classes = [IsAuthenticated]
