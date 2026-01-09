# School Staff Attendance - Frontend Only

A mobile-first, frontend-only attendance management system for school principals. All data is stored locally in the browser using IndexedDB.

## 🚀 Features

- **100% Frontend**: No backend required - runs entirely in the browser
- **Local Storage**: All data stored in IndexedDB (persists in browser)
- **Offline First**: Works completely offline
- **PWA Ready**: Installable as a Progressive Web App
- **Mobile Optimized**: Designed for mobile devices
- **Free Hosting**: Deploy to Vercel for free

## 📦 Installation

```bash
npm install
```

## 🛠️ Development

```bash
npm run dev
```

Visit `http://localhost:5173`

## 🏗️ Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder.

## 🚢 Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Set **Root Directory** to `frontend`
5. Set **Build Command** to `npm run build`
6. Set **Output Directory** to `dist`
7. Deploy!

See `DEPLOY.md` for detailed instructions.

## 🔐 Default Login

- Email: `admin@school.com`
- PIN: `1234`

## 💾 Data Storage

All data is stored locally in the browser's IndexedDB:
- Users (principal login)
- Teachers (added by principal)
- Attendance records
- School settings

**Note**: Data is stored per browser/device. If you clear browser data, you'll need to re-add teachers.

## 📱 Usage

1. Login as principal
2. Add teachers in Settings
3. Mark attendance daily when teachers call
4. View reports for payroll calculation
5. Export CSV/PDF for records

## 🛠️ Tech Stack

- React 18
- Vite
- Tailwind CSS
- IndexedDB (local storage)
- PWA (Progressive Web App)
- Day.js (date handling)
- jsPDF (PDF export)

## 📝 Notes

- This is a **single-user application** (one principal)
- Data is stored **locally in the browser**
- No backend/server required
- Perfect for free hosting on Vercel
- Works completely offline
