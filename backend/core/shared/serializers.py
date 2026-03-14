from rest_framework import serializers
from core.shared.models import SchoolTenant
from .models import School


class SchoolTenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchoolTenant
        fields = ["id", "name", "code", "schema_name", "contact_email", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = '__all__'
