import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { School, GraduationCap, Users, ClipboardCheck, Clock, BookOpen, UserCheck } from 'lucide-react';

export default function Login() {
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [pin, setPin] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(phoneOrEmail, pin, rememberDevice);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Login failed');
      setLoading(false);
    }
  };

  // Background icons with different animations
  const backgroundIcons = [
    { Icon: School, delay: 0, duration: '20s', size: 120, top: '10%', left: '5%', opacity: 0.1 },
    { Icon: GraduationCap, delay: 2, duration: '25s', size: 100, top: '20%', right: '8%', opacity: 0.12 },
    { Icon: Users, delay: 4, duration: '18s', size: 110, top: '50%', left: '3%', opacity: 0.1 },
    { Icon: ClipboardCheck, delay: 1, duration: '22s', size: 130, bottom: '15%', right: '5%', opacity: 0.12 },
    { Icon: Clock, delay: 3, duration: '19s', size: 90, top: '70%', left: '10%', opacity: 0.1 },
    { Icon: BookOpen, delay: 5, duration: '24s', size: 100, top: '30%', right: '2%', opacity: 0.1 },
    { Icon: UserCheck, delay: 2.5, duration: '21s', size: 95, bottom: '25%', left: '8%', opacity: 0.12 },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Animated Background Icons */}
      <div className="absolute inset-0 pointer-events-none">
        {backgroundIcons.map((item, index) => {
          const { Icon, delay, duration, size, top, bottom, left, right, opacity } = item;
          return (
            <div
              key={index}
              className="absolute animate-float"
              style={{
                top: top || 'auto',
                bottom: bottom || 'auto',
                left: left || 'auto',
                right: right || 'auto',
                animationDelay: `${delay}s`,
                animationDuration: duration,
                opacity: opacity,
              }}
            >
              <Icon
                className="text-blue-400 dark:text-blue-500"
                style={{ width: size, height: size }}
              />
            </div>
          );
        })}
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-blue-300 dark:bg-blue-600 rounded-full animate-pulse-slow"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
              opacity: 0.3,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md animate-fade-in relative z-10">
        <div className="bg-gradient-to-br from-white/95 to-blue-50/95 dark:from-gray-800/95 dark:to-gray-700/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-blue-100/50 dark:border-gray-700/50 animate-scale-in">
          {/* Logo/Icon at top */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl mb-4 shadow-lg animate-pulse-slow">
              <School className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-cyan-400 mb-2">
              School Attendance
            </h1>
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              Principal Login
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Mark attendance when teachers call
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-2xl text-sm animate-slide-up">
                {error}
              </div>
            )}

            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <label
                htmlFor="phoneOrEmail"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Phone or Email
              </label>
              <input
                id="phoneOrEmail"
                type="text"
                value={phoneOrEmail}
                onChange={(e) => setPhoneOrEmail(e.target.value)}
                required
                autoComplete="username"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-600"
                placeholder="admin@school.com"
              />
            </div>

            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <label
                htmlFor="pin"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                PIN
              </label>
              <input
                id="pin"
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                autoComplete="current-password"
                maxLength={6}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-600"
                placeholder="Enter 4-6 digit PIN"
              />
            </div>

            <div className="flex items-center animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <input
                id="rememberDevice"
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-all duration-300"
              />
              <label
                htmlFor="rememberDevice"
                className="ml-2 text-sm text-gray-700 dark:text-gray-300"
              >
                Remember this device
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 animate-slide-up"
              style={{ animationDelay: '0.4s' }}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Signing in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400 animate-fade-in">
            <p className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-2xl border border-blue-100 dark:border-blue-800">
              Login: admin@school.com / PIN: 1234
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
