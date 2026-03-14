

from django.db import models
from django.conf import settings
from core.shared.models import School, Role, Teacher, Student, Department, Subject, AcademicYear, Term, Sequence, SchoolClass




# --- Section ---
class Section(models.Model):
    name = models.CharField(max_length=20)
    school_class = models.ForeignKey(SchoolClass, on_delete=models.CASCADE, related_name="sections")
    class_teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="managed_sections")

    class Meta:
        unique_together = ("name", "school_class")

    def __str__(self):
        return f"{self.school_class.name} - {self.name}"


# --- SubjectOffering ---
class SubjectOffering(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="subject_offerings")
    school_class = models.ForeignKey(SchoolClass, on_delete=models.CASCADE, related_name="subject_offerings")
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name="subject_offerings")
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name="subject_offerings")
    type = models.CharField(max_length=20, choices=[("compulsory", "Compulsory"), ("optional", "Optional")], default="compulsory")

    def __str__(self):
        return f"{self.subject} - {self.school_class} ({self.academic_year})"

# --- StudentSubjectRegistration ---
class StudentSubjectRegistration(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="subject_registrations")
    subject_offering = models.ForeignKey(SubjectOffering, on_delete=models.CASCADE, related_name="student_registrations")

    class Meta:
        unique_together = ("student", "subject_offering")

    def __str__(self):
        return f"{self.student} - {self.subject_offering}"

# --- Route ---
class Route(models.Model):
    name = models.CharField(max_length=120)
    driver_name = models.CharField(max_length=120, blank=True)
    vehicle_number = models.CharField(max_length=40, blank=True)

    def __str__(self):
        return self.name

# --- TransportAssignment ---
class TransportAssignment(models.Model):
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name="assignments")
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="transport_assignments")
    pickup_point = models.CharField(max_length=120)
    active = models.BooleanField(default=True)

    class Meta:
        unique_together = ("route", "student")

    def __str__(self):
        return f"{self.student} - {self.route}"

# --- Exam ---
class Exam(models.Model):
    title = models.CharField(max_length=120)
    exam_type = models.CharField(max_length=40, blank=True)
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name="exams")
    date = models.DateField()

    class Meta:
        ordering = ["date"]

    def __str__(self):
        return f"{self.title} ({self.section})"

# --- ExamResult ---
class ExamResult(models.Model):
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name="results")
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="exam_results")
    score = models.DecimalField(max_digits=6, decimal_places=2)
    grade = models.CharField(max_length=5, blank=True)

    class Meta:
        unique_together = ("exam", "student")
        ordering = ["exam", "student"]

    def __str__(self):
        return f"{self.student.full_name} - {self.exam.title}"

# --- Announcement ---
class Announcement(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name="announcements")
    school_class = models.ForeignKey(SchoolClass, on_delete=models.SET_NULL, null=True, blank=True, related_name="announcements")
    title = models.CharField(max_length=150)
    message = models.TextField()
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="created_announcements")
    created_at = models.DateTimeField(auto_now_add=True)
    expiry_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

# --- Notification ---
class Notification(models.Model):
    TYPE_CHOICES = [
        ("academic", "Academic"),
        ("finance", "Finance"),
        ("library", "Library"),
        ("general", "General"),
    ]
    STATUS_CHOICES = [
        ("read", "Read"),
        ("unread", "Unread"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=150)
    message = models.TextField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default="general")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="unread")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.user.username})"

# --- FeeStructure ---
class FeeStructure(models.Model):
    school_class = models.ForeignKey(SchoolClass, on_delete=models.CASCADE, related_name="fee_structures")
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name="fee_structures")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"{self.school_class} ({self.academic_year}) - {self.amount}"

# --- Invoice ---
class Invoice(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="invoices")
    school_class = models.ForeignKey(SchoolClass, on_delete=models.CASCADE, related_name="invoices")
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name="invoices")
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=[("paid", "Paid"), ("partially_paid", "Partially Paid"), ("unpaid", "Unpaid")], default="unpaid")
    due_date = models.DateField()

    def __str__(self):
        return f"Invoice: {self.student} - {self.school_class} ({self.academic_year})"

# --- Payment ---
class Payment(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="payments")
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="payments")
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=30, blank=True)
    date_paid = models.DateTimeField(auto_now_add=True)
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="recorded_payments")

    def __str__(self):
        return f"Payment: {self.student} - {self.amount_paid} ({self.invoice})"

# --- ReportSnapshot ---
class ReportSnapshot(models.Model):
    name = models.CharField(max_length=140)
    category = models.CharField(max_length=40)
    payload = models.JSONField(default=dict)
    generated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

# --- AttendanceRecord ---
class AttendanceRecord(models.Model):
    class Status(models.TextChoices):
        PRESENT = "present", "Present"
        ABSENT = "absent", "Absent"
        LATE = "late", "Late"

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="attendance_records")
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name="attendance_records")
    date = models.DateField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PRESENT)
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="recorded_attendance")

    class Meta:
        unique_together = ("student", "section", "date")
        ordering = ["-date"]

    def __str__(self):
        return f"{self.student.full_name} - {self.date} - {self.status}"


# --- Book ---
class Book(models.Model):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name="books")
    title = models.CharField(max_length=180)
    author = models.CharField(max_length=120)
    isbn = models.CharField(max_length=40, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    shelf_location = models.CharField(max_length=100, blank=True)
    book_cover_image = models.ImageField(upload_to="book_covers/", blank=True, null=True)

    def __str__(self):
        return self.title

# --- Borrow ---
class Borrow(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="borrows")
    student = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True, blank=True, related_name="borrows")
    teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True, related_name="borrows")
    issue_date = models.DateField()
    return_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=[("issued", "Issued"), ("returned", "Returned")], default="issued")

    def __str__(self):
        return f"{self.book} - {self.student or self.teacher}"
from django.db import models
from django.contrib.auth.models import AbstractUser


# --- Audit Log ---
class AuditLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="audit_logs")
    action = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.action}"

# --- Section ---
class Section(models.Model):
    name = models.CharField(max_length=20)
    school_class = models.ForeignKey(SchoolClass, on_delete=models.CASCADE, related_name="sections")
    from django.conf import settings
    class_teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="managed_sections")

    class Meta:
        unique_together = ("name", "school_class")

    def __str__(self):
        return f"{self.school_class.name} - {self.name}"

# --- SubjectOffering ---
class SubjectOffering(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="subject_offerings")
    school_class = models.ForeignKey(SchoolClass, on_delete=models.CASCADE, related_name="subject_offerings")
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name="subject_offerings")
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name="subject_offerings")
    type = models.CharField(max_length=20, choices=[("compulsory", "Compulsory"), ("optional", "Optional")], default="compulsory")

    def __str__(self):
        return f"{self.subject} - {self.school_class} ({self.academic_year})"

# --- StudentSubjectRegistration ---
class StudentSubjectRegistration(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="subject_registrations")
    subject_offering = models.ForeignKey(SubjectOffering, on_delete=models.CASCADE, related_name="student_registrations")

    class Meta:
        unique_together = ("student", "subject_offering")

    def __str__(self):
        return f"{self.student} - {self.subject_offering}"

# --- Route ---
class Route(models.Model):
    name = models.CharField(max_length=120)
    driver_name = models.CharField(max_length=120, blank=True)
    vehicle_number = models.CharField(max_length=40, blank=True)

    def __str__(self):
        return self.name

# --- Transport Assignment ---
class TransportAssignment(models.Model):
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name="assignments")
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="transport_assignments")
    pickup_point = models.CharField(max_length=120)
    active = models.BooleanField(default=True)

    class Meta:
        unique_together = ("route", "student")

    def __str__(self):
        return f"{self.student} - {self.route}"

# --- Exam ---
class Exam(models.Model):
    title = models.CharField(max_length=120)
    exam_type = models.CharField(max_length=40, blank=True)
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name="exams")
    date = models.DateField()

    class Meta:
        ordering = ["date"]

    def __str__(self):
        return f"{self.title} ({self.section})"

# --- ExamResult ---
class ExamResult(models.Model):
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name="results")
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="exam_results")
    score = models.DecimalField(max_digits=6, decimal_places=2)
    grade = models.CharField(max_length=5, blank=True)

    class Meta:
        unique_together = ("exam", "student")
        ordering = ["exam", "student"]

    def __str__(self):
        return f"{self.student.username} - {self.exam.title}"

# --- Announcement ---
class Announcement(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name="announcements")
    school_class = models.ForeignKey(SchoolClass, on_delete=models.SET_NULL, null=True, blank=True, related_name="announcements")
    title = models.CharField(max_length=150)
    message = models.TextField()
    from django.conf import settings
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="created_announcements")
    created_at = models.DateTimeField(auto_now_add=True)
    expiry_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

# --- Notification ---
class Notification(models.Model):
    TYPE_CHOICES = [
        ("academic", "Academic"),
        ("finance", "Finance"),
        ("library", "Library"),
        ("general", "General"),
    ]
    STATUS_CHOICES = [
        ("read", "Read"),
        ("unread", "Unread"),
    ]

    from django.conf import settings
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=150)
    message = models.TextField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default="general")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="unread")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.user.username})"

# --- FeeStructure ---
class FeeStructure(models.Model):
    school_class = models.ForeignKey(SchoolClass, on_delete=models.CASCADE, related_name="fee_structures")
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name="fee_structures")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"{self.school_class} ({self.academic_year}) - {self.amount}"

# --- Invoice ---
class Invoice(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="invoices")
    school_class = models.ForeignKey(SchoolClass, on_delete=models.CASCADE, related_name="invoices")
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name="invoices")
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=[("paid", "Paid"), ("partially_paid", "Partially Paid"), ("unpaid", "Unpaid")], default="unpaid")
    due_date = models.DateField()

    def __str__(self):
        return f"Invoice: {self.student} - {self.school_class} ({self.academic_year})"

# --- Payment ---
class Payment(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="payments")
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="payments")
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=30, blank=True)
    date_paid = models.DateTimeField(auto_now_add=True)
    from django.conf import settings
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="recorded_payments")

    def __str__(self):
        return f"Payment: {self.student} - {self.amount_paid} ({self.invoice})"

# --- ReportSnapshot ---
class ReportSnapshot(models.Model):
    name = models.CharField(max_length=140)
    category = models.CharField(max_length=40)
    payload = models.JSONField(default=dict)
    from django.conf import settings
    generated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

# --- AttendanceRecord ---
class AttendanceRecord(models.Model):
    class Status(models.TextChoices):
        PRESENT = "present", "Present"
        ABSENT = "absent", "Absent"
        LATE = "late", "Late"

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="attendance_records")
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name="attendance_records")
    date = models.DateField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PRESENT)
    from django.conf import settings
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="recorded_attendance")

    class Meta:
        unique_together = ("student", "section", "date")
        ordering = ["-date"]

    def __str__(self):
        return f"{self.student.full_name} - {self.date} - {self.status}"

# --- Book ---
class Book(models.Model):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name="books")
    title = models.CharField(max_length=180)
    author = models.CharField(max_length=120)
    isbn = models.CharField(max_length=40, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    shelf_location = models.CharField(max_length=100, blank=True)
    book_cover_image = models.ImageField(upload_to="book_covers/", blank=True, null=True)

    def __str__(self):
        return self.title

# --- Borrow ---
class Borrow(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="borrows")
    student = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True, blank=True, related_name="borrows")
    teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True, related_name="borrows")
    issue_date = models.DateField()
    return_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=[("issued", "Issued"), ("returned", "Returned")], default="issued")

    def __str__(self):
        return f"{self.book} - {self.student or self.teacher}"
