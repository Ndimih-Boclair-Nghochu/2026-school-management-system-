
from django.contrib import admin
from core.models import ReportSnapshot

try:
	admin.site.register(ReportSnapshot)
except admin.sites.AlreadyRegistered:
	pass
