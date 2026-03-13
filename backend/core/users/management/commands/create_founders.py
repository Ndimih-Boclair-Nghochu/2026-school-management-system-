from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from core.shared.models import Role

class Command(BaseCommand):
    help = 'Create founders (superadmins) with exclusive access.'

    founders = [
        {
            'email': 'ndimihboclair4@gmail.com',
            'password': '@Boclair444',
            'first_name': 'Ndimih',
            'last_name': 'Boclair',
        },
        {
            'email': 'nsamerenetamjong@gmail.com',
            'password': '@Msame555',
            'first_name': 'Nsamere',
            'last_name': 'Netamjong',
        },
    ]

    def handle(self, *args, **options):
        User = get_user_model()
        founder_role, created = Role.objects.get_or_create(name='Founder')
        for founder in self.founders:
            user, created = User.objects.get_or_create(
                email=founder['email'],
                defaults={
                    'username': founder['email'],
                    'first_name': founder['first_name'],
                    'last_name': founder['last_name'],
                    'role': founder_role,
                }
            )
            if created:
                user.set_password(founder['password'])
                user.save()
                self.stdout.write(self.style.SUCCESS(f"Founder created: {founder['email']}"))
            else:
                self.stdout.write(self.style.WARNING(f"Founder already exists: {founder['email']}"))
        self.stdout.write(self.style.SUCCESS('Founder setup complete.'))
