# Deploy to Vercel

This is now a **frontend-only application** that uses IndexedDB for local storage. Perfect for free Vercel deployment!

## Quick Deploy Steps

1. **Push to GitHub** (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Sign up/login
   - Click "New Project"
   - Import your GitHub repository
   - **Root Directory**: Set to `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - Click "Deploy"

3. **That's it!** Your app will be live in seconds.

## Important Notes

- **Data Storage**: All data is stored locally in the browser's IndexedDB
- **No Backend Needed**: Everything runs in the browser
- **Offline Support**: Works completely offline (PWA enabled)
- **Single User**: Perfect for one principal using the app
- **Data Persistence**: Data persists in the browser until cleared

## Default Login

- Email: `admin@school.com`
- PIN: `1234`

## Building Locally

```bash
cd frontend
npm install
npm run build
npm run preview  # Test the production build
```

## Features

✅ No backend required  
✅ Free Vercel hosting  
✅ Works offline  
✅ PWA installable  
✅ All data stored locally  
✅ Fast and responsive  
