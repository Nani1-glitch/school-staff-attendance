# Backend API Documentation

## Environment Variables

Create a `.env` file in the backend directory:

```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
```

## Database Setup

1. Generate Prisma Client:
```bash
npm run db:generate
```

2. Run migrations:
```bash
npm run db:migrate
```

3. Seed database:
```bash
npm run db:seed
```

## API Endpoints

All endpoints are prefixed with `/api`

### Authentication
- `POST /api/auth/login` - Login with phoneOrEmail and PIN
- `GET /api/auth/me` - Get current authenticated user
- `POST /api/auth/change-pin` - Change user PIN

### Attendance
- `GET /api/attendance/today` - Get today's attendance records
- `GET /api/attendance/date/:date` - Get attendance for specific date (YYYY-MM-DD)
- `POST /api/attendance/check-in` - Teacher self check-in
- `POST /api/attendance/check-out` - Teacher self check-out
- `POST /api/attendance/mark` - Admin mark attendance (requires admin role)
- `PUT /api/attendance/:recordId` - Edit attendance record (requires admin role, editReason required)
- `GET /api/attendance/stats/today` - Get today's attendance statistics

### Teachers
- `GET /api/teachers` - List all active teachers
- `GET /api/teachers/:id` - Get teacher details
- `POST /api/teachers` - Create new teacher (admin only)
- `PUT /api/teachers/:id` - Update teacher (admin only)
- `DELETE /api/teachers/:id` - Deactivate teacher (admin only)

### Reports
- `GET /api/reports` - Get attendance records with filters
  - Query params: startDate, endDate, teacherId, department, status
- `GET /api/reports/stats` - Get attendance statistics
  - Query params: startDate, endDate, teacherId
- `GET /api/reports/export/csv` - Export CSV report
- `GET /api/reports/export/pdf` - Export PDF report

### Settings
- `GET /api/settings` - Get school settings
- `PUT /api/settings` - Update school settings (admin only)

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Error Responses

All errors follow this format:
```json
{
  "error": "Error message"
}
```

Status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error
