import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { teachersAPI, attendanceAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { Clock, CheckCircle, XCircle, AlertCircle, Edit2, Save } from 'lucide-react';
import StatusModal from '../components/StatusModal';
import NotesModal from '../components/NotesModal';

// Helper functions for Indian timezone
const getIndianTime = () => {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
};

const formatIndianDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return dayjs(date).format('dddd, D MMM YYYY');
};

const getTodayDateStr = () => {
  const indianDate = getIndianTime();
  return indianDate.toISOString().split('T')[0];
};

const getCurrentTimeStr = () => {
  const indianDate = getIndianTime();
  return dayjs(indianDate).format('HH:mm');
};

export default function Attendance() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  useEffect(() => {
    loadTodayAttendance();
  }, []);

  const loadTodayAttendance = async () => {
    try {
      const [records, allTeachers] = await Promise.all([
        attendanceAPI.getToday(),
        teachersAPI.getAll()
      ]);

      // Merge attendance records with teachers
      const teachersWithAttendance = allTeachers.map((teacher) => {
        const record = records.find((r) => r.teacherId === teacher.id);
        return {
          ...teacher,
          attendance: record ? {
            id: record.id,
            status: record.status,
            timeIn: record.timeIn,
            timeOut: record.timeOut,
            lateMinutes: record.lateMinutes || 0,
            earlyMinutes: record.earlyMinutes || 0,
            totalMinutes: record.totalMinutes,
            notes: record.notes
          } : {
            status: 'NOT_MARKED',
            timeIn: null,
            timeOut: null,
            lateMinutes: 0,
            earlyMinutes: 0,
            totalMinutes: null
          }
        };
      });

      setTeachers(teachersWithAttendance);
    } catch (error) {
      console.error('Failed to load attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeIn = async (teacherId) => {
    try {
      const today = getTodayDateStr();
      const timeIn = getCurrentTimeStr();

      await attendanceAPI.markAttendance({
        teacherId,
        date: today,
        status: 'PRESENT',
        timeIn
      });

      await loadTodayAttendance();
    } catch (error) {
      console.error('Failed to mark time in:', error);
      alert('Failed to mark time in. Please try again.');
    }
  };

  const handleTimeOut = async (teacherId, currentTimeIn) => {
    if (!currentTimeIn) {
      alert('Teacher must check in first');
      return;
    }

    try {
      const today = getTodayDateStr();
      const timeOut = getCurrentTimeStr();

      const teacher = teachers.find((t) => t.id === teacherId);
      if (!teacher) return;

      await attendanceAPI.markAttendance({
        teacherId,
        date: today,
        status: teacher.attendance.status,
        timeIn: teacher.attendance.timeIn,
        timeOut
      });

      await loadTodayAttendance();
    } catch (error) {
      console.error('Failed to mark time out:', error);
      alert('Failed to mark time out. Please try again.');
    }
  };

  const handleStatusChange = async (teacherId, status, timeIn, timeOut, notes, editReason) => {
    try {
      const today = getTodayDateStr();
      const currentTimeIn = timeIn || getCurrentTimeStr();
      const record = teachers.find(t => t.id === teacherId)?.attendance;

      // If editing existing record
      if (editingRecord && record?.id) {
        await attendanceAPI.updateAttendance(record.id, {
          teacherId,
          date: today,
          status,
          timeIn: status === 'PRESENT' ? currentTimeIn : null,
          timeOut: timeOut || null,
          notes: notes || null
        });

        setStatusModalOpen(false);
        setEditingRecord(null);
        await loadTodayAttendance();
      } else {
        // New record
        await attendanceAPI.markAttendance({
          teacherId,
          date: today,
          status,
          timeIn: status === 'PRESENT' ? currentTimeIn : null,
          timeOut: timeOut || null,
          notes: notes || null
        });

        setStatusModalOpen(false);
        await loadTodayAttendance();
      }
    } catch (error) {
      console.error('Failed to update attendance:', error);
      alert('Failed to update attendance. Please try again.');
    }
  };

  const handleEdit = (teacher) => {
    setEditingRecord(teacher);
    setSelectedTeacher(teacher);
    setStatusModalOpen(true);
  };

  const formatMinutes = (minutes) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 dark:from-emerald-900/30 dark:to-teal-900/30 dark:text-emerald-300';
      case 'ABSENT':
        return 'bg-gradient-to-r from-rose-100 to-pink-100 text-rose-800 dark:from-rose-900/30 dark:to-pink-900/30 dark:text-rose-300';
      case 'LEAVE':
        return 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 dark:from-amber-900/30 dark:to-orange-900/30 dark:text-amber-300';
      case 'HALF_DAY':
        return 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 dark:from-orange-900/30 dark:to-red-900/30 dark:text-orange-300';
      default:
        return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 dark:from-gray-700 dark:to-slate-700 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between mb-6 animate-slide-up">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-cyan-400">
            Today's Attendance
          </h2>
          <p className="text-base text-gray-600 dark:text-gray-400 mt-2 font-medium">
            {formatIndianDate(getTodayDateStr())} • Mark attendance when teachers call you
          </p>
        </div>
        <button
          onClick={loadTodayAttendance}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-2xl text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {teachers.map((teacher, index) => (
          <div
            key={teacher.id}
            className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-3xl shadow-lg p-5 border border-blue-100 dark:border-gray-700 hover-lift animate-slide-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-400 dark:from-blue-500 dark:to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {teacher.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {teacher.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {teacher.department} • {teacher.subject}
                    </p>
                  </div>
                </div>
              </div>
              <span
                className={`px-4 py-2 rounded-2xl text-xs font-bold shadow-md ${getStatusColor(
                  teacher.attendance.status
                )}`}
              >
                {teacher.attendance.status.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Time In:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {teacher.attendance.timeIn || '-'}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Time Out:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {teacher.attendance.timeOut || '-'}
                </span>
              </div>
              {teacher.attendance.lateMinutes > 0 && (
                <div>
                  <span className="text-red-600 dark:text-red-400">Late:</span>
                  <span className="ml-2 font-medium">
                    {formatMinutes(teacher.attendance.lateMinutes)}
                  </span>
                </div>
              )}
              {teacher.attendance.earlyMinutes > 0 && (
                <div>
                  <span className="text-orange-600 dark:text-orange-400">Early Leave:</span>
                  <span className="ml-2 font-medium">
                    {formatMinutes(teacher.attendance.earlyMinutes)}
                  </span>
                </div>
              )}
              {teacher.attendance.totalMinutes && (
                <div className="col-span-2">
                  <span className="text-gray-600 dark:text-gray-400">Total Hours:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {formatMinutes(teacher.attendance.totalMinutes)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {!teacher.attendance.timeIn && (
                <button
                  onClick={() => handleTimeIn(teacher.id)}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-3 px-4 rounded-2xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Clock className="w-4 h-4" />
                  IN
                </button>
              )}
              {teacher.attendance.timeIn && !teacher.attendance.timeOut && (
                <button
                  onClick={() => handleTimeOut(teacher.id, teacher.attendance.timeIn)}
                  className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white py-3 px-4 rounded-2xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Clock className="w-4 h-4" />
                  OUT
                </button>
              )}
              <button
                onClick={() => handleEdit(teacher)}
                className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-3 px-4 rounded-2xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              {teacher.attendance.notes && (
                <button
                  onClick={() => {
                    setSelectedTeacher(teacher);
                    setNotesModalOpen(true);
                  }}
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm"
                >
                  Notes
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {statusModalOpen && selectedTeacher && (
        <StatusModal
          teacher={selectedTeacher}
          onClose={() => {
            setStatusModalOpen(false);
            setSelectedTeacher(null);
            setEditingRecord(null);
          }}
          onSave={handleStatusChange}
          editingRecord={editingRecord}
        />
      )}

      {notesModalOpen && selectedTeacher && (
        <NotesModal
          teacher={selectedTeacher}
          notes={selectedTeacher.attendance.notes}
          onClose={() => {
            setNotesModalOpen(false);
            setSelectedTeacher(null);
          }}
        />
      )}
    </div>
  );
}
