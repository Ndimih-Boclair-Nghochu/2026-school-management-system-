from django.db import models
from django_tenants.models import TenantMixin, DomainMixin

# --- Department ---
class Department(models.Model):
    school = models.ForeignKey('School', on_delete=models.CASCADE, related_name="shared_departments")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

# --- Subject ---
class Subject(models.Model):
    department = models.ForeignKey('Department', on_delete=models.CASCADE, related_name="shared_subjects")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

# --- AcademicYear ---
class AcademicYear(models.Model):
    school = models.ForeignKey('School', on_delete=models.CASCADE, related_name="academic_years")
    name = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=[("active", "Active"), ("inactive", "Inactive")], default="active")

    def __str__(self):
        return f"{self.name} ({self.school})"

# --- Term ---
class Term(models.Model):
    academic_year = models.ForeignKey('AcademicYear', on_delete=models.CASCADE, related_name="terms")
    name = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()

    def __str__(self):
        return f"{self.name} ({self.academic_year})"

# --- Sequence ---
class Sequence(models.Model):
    term = models.ForeignKey('Term', on_delete=models.CASCADE, related_name="sequences")
    academic_year = models.ForeignKey('AcademicYear', on_delete=models.CASCADE, related_name="sequences")
    name = models.CharField(max_length=20)

    def __str__(self):
        return f"{self.name} ({self.term})"

# --- SchoolClass ---
class SchoolClass(models.Model):
    school = models.ForeignKey('School', on_delete=models.CASCADE, related_name="classes")
    academic_year = models.ForeignKey('AcademicYear', on_delete=models.CASCADE, related_name="classes")
    name = models.CharField(max_length=50)

    class Meta:
        unique_together = ("name", "academic_year", "school")

    def __str__(self):
        return f"{self.name} ({self.academic_year}, {self.school})"
from django_tenants.models import TenantMixin, DomainMixin
from django.db import models

# --- School ---
class School(models.Model):
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    logo = models.ImageField(upload_to="school_logos/", blank=True, null=True)
    motto = models.CharField(max_length=255, blank=True)
    vision = models.TextField(blank=True)
    mission = models.TextField(blank=True)
    slogan = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return self.name

# --- Role ---
class Role(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name

# --- Teacher ---
class Teacher(models.Model):
    department = models.ForeignKey('Department', on_delete=models.CASCADE, related_name="shared_teachers")
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    qualification = models.CharField(max_length=255)
    hire_date = models.DateField()

    def __str__(self):
        return self.full_name

# --- Student ---
class Student(models.Model):
    school_class = models.ForeignKey('SchoolClass', on_delete=models.CASCADE, related_name="students")
    academic_year = models.ForeignKey('AcademicYear', on_delete=models.CASCADE, related_name="students")
    full_name = models.CharField(max_length=100)
    matricule = models.CharField(max_length=40, unique=True)
    gender = models.CharField(max_length=10)
    date_of_birth = models.DateField()
    phone = models.CharField(max_length=30, blank=True)
    address = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return self.full_name

class SchoolTenant(TenantMixin):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    contact_email = models.EmailField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    auto_create_schema = True

class SchoolDomain(DomainMixin):
    tenant = models.ForeignKey(SchoolTenant, related_name='domains', on_delete=models.CASCADE)
    domain = models.CharField(max_length=255, unique=True)
    is_primary = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
