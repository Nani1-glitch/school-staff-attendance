import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BottomNav from './BottomNav';
import Header from './Header';

export default function Layout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="h-full flex flex-col pb-20 safe-bottom">
      <Header />
      <main className="flex-1 px-4 py-4 pb-4 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
