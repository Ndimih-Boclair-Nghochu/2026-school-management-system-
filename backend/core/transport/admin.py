
from django.contrib import admin
from core.models import Route, TransportAssignment

for model in [Route, TransportAssignment]:
	try:
		admin.site.register(model)
	except admin.sites.AlreadyRegistered:
		pass
