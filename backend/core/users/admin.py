from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from core.users.models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        (
            "School Fields",
            {
                "fields": (
                    "role",
                    "phone",
                    "matricule",
                )
            },
        ),
    )
    list_display = ("username", "email", "first_name", "last_name", "role", "is_staff")
