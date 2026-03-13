
from django.contrib import admin
from core.models import Invoice, Payment

for model in [Invoice, Payment]:
	try:
		admin.site.register(model)
	except admin.sites.AlreadyRegistered:
		pass
