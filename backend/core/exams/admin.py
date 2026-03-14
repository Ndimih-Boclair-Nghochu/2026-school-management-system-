
from django.contrib import admin
from core.models import Exam, ExamResult

for model in [Exam, ExamResult]:
	try:
		admin.site.register(model)
	except admin.sites.AlreadyRegistered:
		pass
