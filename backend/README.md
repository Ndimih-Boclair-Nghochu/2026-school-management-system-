# EduIgnite Backend (Django + Multitenancy)

This backend is structured to support all dashboards in the frontend with tenant-isolated data per school/institution.

## Architecture

- **Framework:** Django + Django REST Framework
- **Multitenancy:** `django-tenants` (PostgreSQL schemas)
- **Shared (public) schema:** platform-level institutions and domains
- **Tenant schemas:** users, academics, attendance, exams, finance, communication, library, transport, reports

## Apps mapped to dashboards

- `core.shared` → platform/founder controls (schools, domains)
- `core.users` → admin, teachers, students, parents, profiles
- `core.academics` → classes, departments, subjects, timetables
- `core.attendance` → attendance records
- `core.exams` → exams and results
- `core.finance` → fees, invoices, payments
- `core.communication` → announcements, messages, notifications
- `core.library` → books and borrowing
- `core.transport` → routes and assignments
- `core.reports` → generated reports metadata

## Quick start

1. Create a Python virtual environment and activate it.
2. Install dependencies:
   - `pip install -r requirements.txt`
3. Create `.env` from `.env.example` and update DB settings.
4. Ensure PostgreSQL database exists.
5. Run migrations:
   - `python manage.py migrate_schemas --shared`
   - `python manage.py migrate_schemas`
6. Create a superuser:
   - `python manage.py createsuperuser`
7. Run server:
   - `python manage.py runserver`

## API entry points

- Public schema APIs:
   - `/health/`
   - `/api/public/health/`
   - `/api/public/shared/tenants/`
- Tenant APIs:
   - `/api/v1/shared/tenants/`
  - `/api/v1/users/`
  - `/api/v1/academics/`
  - `/api/v1/attendance/`
  - `/api/v1/exams/`
  - `/api/v1/finance/`
  - `/api/v1/communication/`
  - `/api/v1/library/`
  - `/api/v1/transport/`
  - `/api/v1/reports/`

## Notes

- Tenant routing is done by domain (host header).
- Add school domains in public schema before accessing tenant endpoints.
- This is the initial implementation scaffold; business validations and workflow rules can now be incrementally extended.
