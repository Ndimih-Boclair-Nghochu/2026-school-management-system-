from rest_framework import serializers
from core.models import ReportSnapshot


class ReportSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportSnapshot
        fields = "__all__"
