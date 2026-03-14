from django.db import models
from core.users.models import Student
from core.shared.models import SchoolClass, Subject

class Term(models.Model):
    name = models.CharField(max_length=50)
    order = models.PositiveIntegerField()
    active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class Sequence(models.Model):
    name = models.CharField(max_length=50)
    order = models.PositiveIntegerField()
    term = models.ForeignKey(Term, related_name='sequences', on_delete=models.CASCADE)
    active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.term.name} - {self.name}"

class Result(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    class_name = models.ForeignKey(SchoolClass, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    term = models.ForeignKey(Term, on_delete=models.CASCADE)
    sequence = models.ForeignKey(Sequence, on_delete=models.CASCADE)
    score = models.DecimalField(max_digits=5, decimal_places=2)
    grade = models.CharField(max_length=5, blank=True, null=True)
    date_recorded = models.DateField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'class_name', 'subject', 'term', 'sequence')

    def __str__(self):
        return f"{self.student} - {self.subject} - {self.term} - {self.sequence}"



# --- Assignment ---
class Assignment(models.Model):
    title = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    teacher = models.ForeignKey('shared.Teacher', on_delete=models.CASCADE, related_name='assignments')
    class_name = models.ForeignKey(SchoolClass, on_delete=models.CASCADE, related_name='assignments')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='assignments')
    due_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.class_name})"

# --- AssignmentSubmission ---
class AssignmentSubmission(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='assignment_submissions')
    file = models.FileField(upload_to='assignment_submissions/')
    submitted_at = models.DateTimeField(auto_now_add=True)
    grade = models.CharField(max_length=5, blank=True, null=True)
    feedback = models.TextField(blank=True)

    class Meta:
        unique_together = ('assignment', 'student')

    def __str__(self):
        return f"{self.student} - {self.assignment}"

# --- OnlineClass ---
class OnlineClass(models.Model):
    title = models.CharField(max_length=120)
    teacher = models.ForeignKey('shared.Teacher', on_delete=models.CASCADE, related_name='online_classes')
    class_name = models.ForeignKey(SchoolClass, on_delete=models.CASCADE, related_name='online_classes')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='online_classes')
    scheduled_at = models.DateTimeField()
    meeting_link = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.class_name})"

# --- Material ---
class Material(models.Model):
    title = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    teacher = models.ForeignKey('shared.Teacher', on_delete=models.CASCADE, related_name='materials')
    class_name = models.ForeignKey(SchoolClass, on_delete=models.CASCADE, related_name='materials')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='materials')
    file = models.FileField(upload_to='materials/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.class_name})"
