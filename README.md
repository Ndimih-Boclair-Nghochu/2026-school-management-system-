# 2026 School Management System

This is a full-stack school management system built with Django (backend) and React (frontend).

## Features
- Multi-tenant support with `django-tenants`
- Student, teacher, and staff management
- Bulk student enrollment via Excel upload
- AI Assistant integration
- Professional, modern admin dashboard
- Attendance, exams, finance, library, transport, and more

## Getting Started

### Prerequisites
- Python 3.14+
- Node.js 16+
- PostgreSQL (for production/multi-tenant support)

### Backend Setup
1. Navigate to the backend directory:
   ```sh
   cd backend
   ```
2. Install Python dependencies:
   ```sh
   c:/python314/python.exe -m pip install -r requirements.txt
   c:/python314/python.exe -m pip install django-tenants psycopg2
   ```
3. Run migrations:
   ```sh
   c:/python314/python.exe manage.py migrate
   ```
4. Start the server:
   ```sh
   c:/python314/python.exe manage.py runserver
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```sh
   cd frontend
   ```
2. Install Node.js dependencies:
   ```sh
   npm install
   ```
3. Start the React app:
   ```sh
   npm start
   ```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](LICENSE)
