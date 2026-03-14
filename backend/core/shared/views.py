from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from .models import School
from .serializers import SchoolSerializer

class PublicHealthView(APIView):
    permission_classes = [AllowAny]

    def get(self, _request):
        return Response({"status": "ok", "service": "school-management-backend"})


class PublicRootView(APIView):
    permission_classes = [AllowAny]

    def get(self, _request):
        return Response({"message": "Welcome to the public API root."})

class SchoolViewSet(ModelViewSet):
    queryset = School.objects.all()
    serializer_class = SchoolSerializer
    permission_classes = [IsAuthenticated]
