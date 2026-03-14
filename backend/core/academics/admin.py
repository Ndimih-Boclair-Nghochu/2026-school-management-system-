
from django.contrib import admin
from core.models import AcademicYear, SchoolClass, Section

for model in [AcademicYear, SchoolClass, Section]:
	try:
		admin.site.register(model)
	except admin.sites.AlreadyRegistered:
		pass
