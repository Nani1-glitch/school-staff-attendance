import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Moon, Sun, LogOut } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-white/95 to-blue-50/95 dark:from-gray-800/95 dark:to-gray-900/95 backdrop-blur-md border-b border-blue-100 dark:border-gray-700 safe-top shadow-sm">
      <div className="flex items-center justify-between px-4 py-4">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-cyan-400">
            School Attendance
          </h1>
          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            Principal Portal
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-2xl hover:bg-blue-100 dark:hover:bg-gray-700 transition-all duration-300 transform hover:scale-110"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            ) : (
              <Moon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            )}
          </button>
          <button
            onClick={logout}
            className="p-2.5 rounded-2xl hover:bg-rose-100 dark:hover:bg-gray-700 transition-all duration-300 transform hover:scale-110"
            aria-label="Logout"
          >
            <LogOut className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </button>
        </div>
      </div>
    </header>
  );
}
