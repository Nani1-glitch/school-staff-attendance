# School Staff Attendance Management System

A production-ready, mobile-first web application for managing teacher and staff attendance in schools. Built with React, Node.js, Express, and SQLite/Prisma.

## 🚀 Features

- **Mobile-First Design**: Optimized for mobile devices with thumb-friendly UI
- **Role-Based Access**: Separate interfaces for Admin and Teacher roles
- **Real-Time Clock**: Live date and time display
- **Attendance Tracking**: 
  - Check-in/Check-out with timestamps
  - Automatic calculation of late minutes, early leave, and total hours
  - Status management (Present, Absent, Leave, Half-day)
- **Offline Support**: PWA with IndexedDB queue for offline operations
- **Dark/Light Mode**: System preference with manual toggle
- **Reports & Export**: 
  - Daily and monthly reports
  - CSV and PDF export
  - Attendance statistics and insights
- **Admin Features**:
  - Mark attendance for any teacher
  - Edit records with audit trail (reason required)
  - Configure school timings and settings
  - Teacher management (CRUD)
- **Teacher Features**:
  - Self check-in/check-out
  - View personal attendance records
  - Request corrections

## 📋 Prerequisites

- Node.js 18+ and npm
- SQLite (included with Prisma)

## 🛠️ Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Initialize database:
```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

5. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## 🔐 Default Credentials

After seeding the database:

**Admin:**
- Email: `admin@school.com`
- PIN: `1234`

**Teachers:**
- Email: `john@school.com` (and others)
- PIN: `1111` (see seed.js for all teacher PINs)

## 📱 Usage

### Admin Flow

1. Login with admin credentials
2. View dashboard with today's statistics
3. Click "Start Attendance" to mark attendance for teachers
4. Use IN/OUT buttons or Edit to modify records
5. View reports and export data
6. Configure school settings

### Teacher Flow

1. Login with teacher credentials
2. View dashboard
3. Click "Check In / Out" to record attendance
4. View personal reports

## 🏗️ Project Structure

```
attendance/
├── backend/
│   ├── middleware/       # Auth middleware
│   ├── routes/           # API routes
│   ├── utils/            # Utility functions
│   ├── prisma/
│   │   ├── schema.prisma # Database schema
│   │   └── seed.js       # Seed data
│   └── server.js         # Express server
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── contexts/     # React contexts (Auth, Theme)
│   │   ├── pages/        # Page components
│   │   └── utils/        # Utilities (API, storage, offline sync)
│   └── vite.config.js    # Vite configuration
└── README.md
```

## 🗄️ Database Schema

- **User**: Authentication and user management
- **Teacher**: Teacher profiles linked to users
- **AttendanceRecord**: Daily attendance records with timestamps
- **SchoolSettings**: School configuration (timings, grace periods, etc.)

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-pin` - Change PIN

### Attendance
- `GET /api/attendance/today` - Get today's attendance
- `GET /api/attendance/date/:date` - Get attendance for a date
- `POST /api/attendance/check-in` - Teacher check-in
- `POST /api/attendance/check-out` - Teacher check-out
- `POST /api/attendance/mark` - Admin mark attendance
- `PUT /api/attendance/:recordId` - Edit attendance record
- `GET /api/attendance/stats/today` - Today's statistics

### Teachers
- `GET /api/teachers` - List all teachers
- `GET /api/teachers/:id` - Get teacher details
- `POST /api/teachers` - Create teacher (Admin)
- `PUT /api/teachers/:id` - Update teacher (Admin)
- `DELETE /api/teachers/:id` - Deactivate teacher (Admin)

### Reports
- `GET /api/reports` - Get attendance records with filters
- `GET /api/reports/stats` - Get statistics
- `GET /api/reports/export/csv` - Export CSV
- `GET /api/reports/export/pdf` - Export PDF

### Settings
- `GET /api/settings` - Get school settings
- `PUT /api/settings` - Update settings (Admin)

## 📦 Building for Production

### Backend
```bash
cd backend
npm install --production
npm run db:migrate
npm start
```

### Frontend
```bash
cd frontend
npm run build
# Serve the dist/ directory with a static server
```

## 🚢 Deployment

### Backend Deployment

1. Set environment variables on your hosting platform
2. Run migrations: `npm run db:migrate`
3. Seed initial data: `npm run db:seed` (optional)
4. Start the server: `npm start`

### Frontend Deployment

1. Build the app: `npm run build`
2. Deploy the `dist/` folder to a static hosting service (Vercel, Netlify, etc.)
3. Update API base URL in production

### Database Migration to PostgreSQL

For production, you can migrate from SQLite to PostgreSQL:

1. Update `DATABASE_URL` in `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/attendance?schema=public"
```

2. Run migrations:
```bash
npm run db:migrate
```

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Audit trail for record edits (reason required)
- Input validation and sanitization

## 📱 PWA Features

- Offline support with IndexedDB
- Automatic sync when online
- Installable on mobile devices
- Service worker for caching

## 🎨 Tech Stack

**Frontend:**
- React 18
- Vite
- Tailwind CSS
- React Router
- Day.js
- Axios
- IndexedDB (idb)

**Backend:**
- Node.js
- Express
- Prisma ORM
- SQLite (PostgreSQL-ready)
- JWT
- bcryptjs
- PDFKit

## 📝 License

ISC

## 🤝 Contributing

This is a production-ready application. For improvements or bug fixes, please follow standard development practices.

## 📞 Support

For issues or questions, please refer to the codebase documentation or create an issue in the repository.

---

Built with ❤️ for efficient school attendance management.
