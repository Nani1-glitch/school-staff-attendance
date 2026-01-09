# Quick Setup Guide

## Prerequisites
- Node.js 18+ installed
- npm or yarn

## Step-by-Step Setup

### 1. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Setup Backend

```bash
cd backend

# Create .env file (copy from .env.example if needed)
# DATABASE_URL="file:./dev.db"
# JWT_SECRET="your-super-secret-jwt-key-change-in-production"
# JWT_EXPIRES_IN="7d"
# PORT=3001
# NODE_ENV=development

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed
```

### 3. Start Backend Server

```bash
cd backend
npm run dev
```

Backend will run on `http://localhost:3001`

### 4. Start Frontend Server

In a new terminal:

```bash
cd frontend
npm run dev
```

Frontend will run on `http://localhost:5173`

### 5. Access the Application

Open your browser and navigate to `http://localhost:5173`

**Login Credentials:**
- Admin: `admin@school.com` / PIN: `1234`
- Teacher: `john@school.com` / PIN: `1111` (see seed.js for more)

## Troubleshooting

### Database Issues
- If migration fails, delete `backend/dev.db` and run migrations again
- Ensure Prisma client is generated: `npm run db:generate`

### Port Conflicts
- Change `PORT` in `backend/.env` if 3001 is in use
- Change port in `frontend/vite.config.js` if 5173 is in use

### Missing Dependencies
- Run `npm install` in both backend and frontend directories
- Delete `node_modules` and `package-lock.json` and reinstall if issues persist

## Production Build

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
# Serve the dist/ folder with a static server
```

## Next Steps

1. Review the README.md for detailed documentation
2. Customize school settings in the admin panel
3. Add your own teachers or import via CSV
4. Configure PWA icons (add icon-192x192.png and icon-512x512.png to frontend/public/)
