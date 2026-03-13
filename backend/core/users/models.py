from django.contrib.auth.models import AbstractUser
from django.db import models
from core.shared.models import School, Role, Teacher, Student


# --- Parent ---
class Parent(models.Model):
    user = models.OneToOneField('User', on_delete=models.CASCADE, related_name='parent_profile')
    school = models.ForeignKey(School, on_delete=models.SET_NULL, null=True, blank=True, related_name="parents")
    phone = models.CharField(max_length=30, blank=True)
    address = models.CharField(max_length=255, blank=True)
    avatar = models.ImageField(upload_to="parent_avatars/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.user.get_full_name() or self.user.username

# --- ParentChild relationship ---
class ParentChild(models.Model):
    parent = models.ForeignKey(Parent, on_delete=models.CASCADE, related_name="children")
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="parents")
    relationship = models.CharField(max_length=40, blank=True)  # e.g. father, mother, guardian
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("parent", "student")

    def __str__(self):
        return f"{self.parent} - {self.student} ({self.relationship})"

class User(AbstractUser):
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True, related_name="users_user_role")
    school = models.ForeignKey(School, on_delete=models.SET_NULL, null=True, blank=True, related_name="users_user_school")
    linked_teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True, related_name="users_user_teacher")
    linked_student = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True, blank=True, related_name="users_user_student")
    phone = models.CharField(max_length=30, blank=True)
    matricule = models.CharField(max_length=40, blank=True)

    def __str__(self):
        return self.get_full_name() or self.username
