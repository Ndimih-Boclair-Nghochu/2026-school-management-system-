from rest_framework import serializers
from core.models import Route, TransportAssignment


class RouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Route
        fields = "__all__"


class TransportAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransportAssignment
        fields = "__all__"
