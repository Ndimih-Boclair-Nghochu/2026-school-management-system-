
from django.contrib import admin
from core.models import AttendanceRecord

try:
	admin.site.register(AttendanceRecord)
except admin.sites.AlreadyRegistered:
	pass
