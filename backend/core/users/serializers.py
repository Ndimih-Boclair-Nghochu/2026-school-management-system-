from rest_framework import serializers
from core.users.models import User, Parent, ParentChild



# --- ParentSerializer ---
class ParentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Parent
        fields = [
            "id", "user", "school", "phone", "address", "avatar", "created_at"
        ]
        read_only_fields = ["id", "created_at"]

# --- ParentChildSerializer ---
class ParentChildSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParentChild
        fields = [
            "id", "parent", "student", "relationship", "created_at"
        ]
        read_only_fields = ["id", "created_at"]

# --- UserSerializer ---
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "role",
            "phone",
            "matricule",
            "is_active",
        ]
        read_only_fields = ["id"]
