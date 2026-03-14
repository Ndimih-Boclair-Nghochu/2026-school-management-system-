from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from core.models import AcademicYear, SchoolClass, Section
from .models import Term, Sequence, Result, Assignment, AssignmentSubmission, OnlineClass, Material
from .serializers import AcademicYearSerializer, SchoolClassSerializer, SectionSerializer, TermSerializer, SequenceSerializer, ResultSerializer, AssignmentSerializer, AssignmentSubmissionSerializer, OnlineClassSerializer, MaterialSerializer


class AcademicYearViewSet(ModelViewSet):
    queryset = AcademicYear.objects.all().order_by("-id")
    serializer_class = AcademicYearSerializer
    permission_classes = [IsAuthenticated]


class SchoolClassViewSet(ModelViewSet):
    queryset = SchoolClass.objects.select_related("academic_year").all().order_by("name")
    serializer_class = SchoolClassSerializer
    permission_classes = [IsAuthenticated]


class SectionViewSet(ModelViewSet):
    queryset = Section.objects.select_related("school_class", "class_teacher").all().order_by("name")
    serializer_class = SectionSerializer
    permission_classes = [IsAuthenticated]


class TermViewSet(ModelViewSet):
    queryset = Term.objects.all().order_by('order')
    serializer_class = TermSerializer
    permission_classes = [IsAuthenticated]

class SequenceViewSet(ModelViewSet):
    queryset = Sequence.objects.select_related('term').all().order_by('term', 'order')
    serializer_class = SequenceSerializer
    permission_classes = [IsAuthenticated]

class ResultViewSet(ModelViewSet):
    queryset = Result.objects.select_related('student', 'class_name', 'subject', 'term', 'sequence').all()
    serializer_class = ResultSerializer
    permission_classes = [IsAuthenticated]

class AssignmentViewSet(ModelViewSet):
    queryset = Assignment.objects.select_related('teacher', 'class_name', 'subject').all()
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated]

class AssignmentSubmissionViewSet(ModelViewSet):
    queryset = AssignmentSubmission.objects.select_related('assignment', 'student').all()
    serializer_class = AssignmentSubmissionSerializer
    permission_classes = [IsAuthenticated]

class OnlineClassViewSet(ModelViewSet):
    queryset = OnlineClass.objects.select_related('teacher', 'class_name', 'subject').all()
    serializer_class = OnlineClassSerializer
    permission_classes = [IsAuthenticated]

class MaterialViewSet(ModelViewSet):
    queryset = Material.objects.select_related('teacher', 'class_name', 'subject').all()
    serializer_class = MaterialSerializer
    permission_classes = [IsAuthenticated]
