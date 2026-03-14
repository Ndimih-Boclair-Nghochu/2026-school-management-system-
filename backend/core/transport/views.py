from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from core.models import Route, TransportAssignment
from .serializers import RouteSerializer, TransportAssignmentSerializer


class RouteViewSet(ModelViewSet):
    queryset = Route.objects.all().order_by("name")
    serializer_class = RouteSerializer
    permission_classes = [IsAuthenticated]


class TransportAssignmentViewSet(ModelViewSet):
    queryset = TransportAssignment.objects.select_related("route", "student").all().order_by("-id")
    serializer_class = TransportAssignmentSerializer
    permission_classes = [IsAuthenticated]
