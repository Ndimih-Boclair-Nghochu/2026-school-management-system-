
from django.contrib import admin
from core.models import Book, Borrow

for model in [Book, Borrow]:
	try:
		admin.site.register(model)
	except admin.sites.AlreadyRegistered:
		pass
