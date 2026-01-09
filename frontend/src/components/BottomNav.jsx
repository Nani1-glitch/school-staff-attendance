import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ClipboardList, FileText, Settings } from 'lucide-react';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/attendance', icon: ClipboardList, label: 'Attendance' },
    { path: '/reports', icon: FileText, label: 'Reports' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white/95 to-blue-50/95 dark:from-gray-800/95 dark:to-gray-900/95 backdrop-blur-md border-t border-blue-100 dark:border-gray-700 safe-bottom z-50 shadow-lg">
      <div className="flex justify-around items-center h-18 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 py-2 mx-1 ${
                isActive
                  ? 'text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              <div className={`relative mb-1 ${
                isActive 
                  ? 'w-12 h-12 rounded-full bg-gradient-to-br from-blue-400/90 to-cyan-400/90 backdrop-blur-xl border-2 border-white/30 shadow-lg shadow-blue-500/30 flex items-center justify-center' 
                  : 'w-10 h-10 rounded-full bg-white/20 dark:bg-gray-700/20 backdrop-blur-sm border border-white/20 dark:border-gray-600/20 flex items-center justify-center hover:bg-white/30 dark:hover:bg-gray-700/30'
              }`}>
                <Icon className={`${isActive ? 'w-5 h-5 animate-bounce' : 'w-5 h-5'}`} />
                {isActive && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
                )}
              </div>
              <span className={`text-xs font-bold ${isActive ? 'text-white' : ''}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
