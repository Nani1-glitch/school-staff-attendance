import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { X } from 'lucide-react';

// Helper to get current Indian time
const getCurrentIndianTime = () => {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
};

export default function StatusModal({ teacher, onClose, onSave, editingRecord }) {
  const getDefaultTimeIn = () => {
    if (editingRecord?.attendance?.timeIn) {
      return editingRecord.attendance.timeIn;
    }
    const indianTime = getCurrentIndianTime();
    return dayjs(indianTime).format('HH:mm');
  };

  const [status, setStatus] = useState(editingRecord?.attendance?.status || 'NOT_MARKED');
  const [timeIn, setTimeIn] = useState(getDefaultTimeIn());
  const [timeOut, setTimeOut] = useState(editingRecord?.attendance?.timeOut || '');
  const [notes, setNotes] = useState(editingRecord?.attendance?.notes || '');
  const [editReason, setEditReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingRecord && !editReason.trim()) {
      alert('Please provide a reason for editing this record');
      return;
    }
    onSave(teacher.id, status, timeIn, timeOut, notes, editReason);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in border border-blue-100 dark:border-gray-700">
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-blue-600 dark:to-cyan-600 border-b border-blue-200 dark:border-gray-600 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-xl font-bold text-white">
            {editingRecord ? 'Edit Attendance' : 'Mark Attendance'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-2xl transition-all duration-300 transform hover:scale-110"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Teacher
            </label>
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-gray-900 dark:text-white font-medium">{teacher.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {teacher.department} • {teacher.subject}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
              required
            >
              <option value="NOT_MARKED">Not Marked</option>
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="LEAVE">Leave</option>
              <option value="HALF_DAY">Half Day</option>
            </select>
          </div>

          {status === 'PRESENT' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Time In
                </label>
                <input
                  type="time"
                  value={timeIn}
                  onChange={(e) => setTimeIn(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Time Out
                </label>
                <input
                  type="time"
                  value={timeOut}
                  onChange={(e) => setTimeOut(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
              placeholder="Optional notes..."
            />
          </div>

          {editingRecord && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Edit Reason *
              </label>
              <textarea
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                rows={2}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                placeholder="Please provide a reason for editing this record..."
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
