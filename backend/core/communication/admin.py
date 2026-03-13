
from django.contrib import admin
from core.models import Announcement

try:
	admin.site.register(Announcement)
except admin.sites.AlreadyRegistered:
	pass
