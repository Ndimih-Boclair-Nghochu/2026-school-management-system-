from rest_framework import serializers
from core.models import AcademicYear, SchoolClass, Section
from .models import Term, Sequence, Result
from core.academics.models import Assignment, AssignmentSubmission, OnlineClass, Material

class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = "__all__"


class SchoolClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchoolClass
        fields = "__all__"


class SectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Section
        fields = "__all__"


class TermSerializer(serializers.ModelSerializer):
    class Meta:
        model = Term
        fields = '__all__'


class SequenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sequence
        fields = '__all__'


class ResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = Result
        fields = '__all__'


# --- AssignmentSerializer ---
class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = [
            "id", "title", "description", "teacher", "class_name", "subject", "due_date", "created_at"
        ]
        read_only_fields = ["id", "created_at"]

# --- AssignmentSubmissionSerializer ---
class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssignmentSubmission
        fields = [
            "id", "assignment", "student", "file", "submitted_at", "grade", "feedback"
        ]
        read_only_fields = ["id", "submitted_at"]

# --- OnlineClassSerializer ---
class OnlineClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = OnlineClass
        fields = [
            "id", "title", "teacher", "class_name", "subject", "scheduled_at", "meeting_link", "created_at"
        ]
        read_only_fields = ["id", "created_at"]

# --- MaterialSerializer ---
class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = [
            "id", "title", "description", "teacher", "class_name", "subject", "file", "uploaded_at"
        ]
        read_only_fields = ["id", "uploaded_at"]

