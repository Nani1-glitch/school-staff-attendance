import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { attendanceAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { Users, UserCheck, UserX, Clock, Calendar } from 'lucide-react';

dayjs.extend(utc);
dayjs.extend(timezone);

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const indianTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      setCurrentTime(dayjs(indianTime));
    };
    
    updateTime();
    const timer = setInterval(updateTime, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const stats = await attendanceAPI.getTodayStats();
      setStats(stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const dateStr = currentTime.format('dddd, D MMM YYYY'); // Indian date format
  const timeStr = currentTime.format('h:mm:ss A');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-4">
      {/* Date and Time Header */}
      <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-3xl shadow-lg p-8 border border-blue-100 dark:border-gray-700 hover-lift animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
            <Calendar className="w-6 h-6 text-blue-500" />
            <span className="text-xl font-bold">{dateStr}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Clock className="w-8 h-8 text-blue-500" />
          <span className="text-5xl font-mono font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-cyan-400 animate-pulse-slow">
            {timeStr}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            icon={UserCheck}
            label="Present"
            value={stats.PRESENT || 0}
            color="green"
            delay={0.1}
          />
          <StatCard
            icon={UserX}
            label="Absent"
            value={stats.ABSENT || 0}
            color="red"
            delay={0.2}
          />
          <StatCard
            icon={Clock}
            label="Leave"
            value={stats.LEAVE || 0}
            color="yellow"
            delay={0.3}
          />
          <StatCard
            icon={Users}
            label="Not Marked"
            value={stats.NOT_MARKED || 0}
            color="gray"
            delay={0.4}
          />
        </div>
      )}

      {/* Primary CTA */}
      <button
        onClick={() => navigate('/attendance')}
        className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-5 px-6 rounded-3xl shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 animate-slide-up"
        style={{ animationDelay: '0.5s' }}
      >
        Mark Attendance
      </button>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, delay = 0 }) {
  const colorConfig = {
    green: {
      bg: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20',
      border: 'border-emerald-200 dark:border-emerald-800',
      iconBg: 'from-emerald-400 to-teal-400',
      icon: 'text-white'
    },
    red: {
      bg: 'from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20',
      border: 'border-rose-200 dark:border-rose-800',
      iconBg: 'from-rose-400 to-pink-400',
      icon: 'text-white'
    },
    yellow: {
      bg: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      iconBg: 'from-amber-400 to-orange-400',
      icon: 'text-white'
    },
    gray: {
      bg: 'from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20',
      border: 'border-slate-200 dark:border-slate-800',
      iconBg: 'from-slate-400 to-gray-400',
      icon: 'text-white'
    }
  };

  const config = colorConfig[color] || colorConfig.gray;

  return (
    <div className={`bg-gradient-to-br ${config.bg} rounded-3xl shadow-lg p-5 border ${config.border} hover-lift animate-slide-up`} style={{ animationDelay: `${delay}s` }}>
      <div className={`w-14 h-14 bg-gradient-to-br ${config.iconBg} rounded-2xl flex items-center justify-center mb-4 shadow-md`}>
        <Icon className={`w-7 h-7 ${config.icon}`} />
      </div>
      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
        {value}
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">{label}</div>
    </div>
  );
}
