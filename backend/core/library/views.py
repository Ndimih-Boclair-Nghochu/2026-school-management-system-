from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from core.models import Book, Borrow, Student, Teacher, ReportSnapshot
from .serializers import BookSerializer, BorrowSerializer
from rest_framework import serializers

class BookViewSet(ModelViewSet):
    queryset = Book.objects.all().order_by("title")
    serializer_class = BookSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["get"], url_path="overdue")
    def overdue_books(self, request):
        overdue = Borrow.objects.filter(status="issued", return_date__isnull=True).exclude(return_date=None)
        overdue_books = [b.book for b in overdue if b.return_date and b.return_date < b.issue_date]
        return Response(BookSerializer(overdue_books, many=True).data)

    @action(detail=False, methods=["get"], url_path="reports")
    def reports(self, request):
        reports = ReportSnapshot.objects.filter(category="library")
        class ReportSnapshotSerializer(serializers.ModelSerializer):
            class Meta:
                model = ReportSnapshot
                fields = '__all__'
        return Response(ReportSnapshotSerializer(reports, many=True).data)

class BorrowViewSet(ModelViewSet):
    queryset = Borrow.objects.select_related("book", "student", "teacher").all().order_by("-issue_date")
    serializer_class = BorrowSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["get"], url_path="overdue")
    def overdue_records(self, request):
        overdue = Borrow.objects.filter(status="issued", return_date__isnull=True).exclude(return_date=None)
        return Response(BorrowSerializer(overdue, many=True).data)

    @action(detail=False, methods=["get"], url_path="members")
    def members(self, request):
        students = Student.objects.all()
        teachers = Teacher.objects.all()
        class MemberSerializer(serializers.Serializer):
            id = serializers.IntegerField()
            name = serializers.CharField()
            type = serializers.CharField()
            matricule = serializers.CharField()
        members = [
            {"id": s.id, "name": str(s), "type": "student", "matricule": getattr(s, "matricule", "")}
            for s in students
        ] + [
            {"id": t.id, "name": str(t), "type": "teacher", "matricule": getattr(t, "matricule", "")}
            for t in teachers
        ]
        return Response(MemberSerializer(members, many=True).data)

    @action(detail=True, methods=["post"], url_path="return")
    def mark_returned(self, request, pk=None):
        borrow = self.get_object()
        borrow.status = "returned"
        borrow.return_date = request.data.get("return_date")
        borrow.save()
        return Response(BorrowSerializer(borrow).data)

    @action(detail=True, methods=["post"], url_path="reminder")
    def send_reminder(self, request, pk=None):
        borrow = self.get_object()
        # Placeholder: send reminder logic
        return Response({"status": "reminder sent", "member": str(borrow.student or borrow.teacher), "book": str(borrow.book)})
