import { useState, useEffect } from 'react';
import { teachersAPI } from '../services/api';
import { X } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

export default function TeacherModal({ teacher, onClose, onSave }) {
      const [formData, setFormData] = useState({
        name: '',
        department: '',
        subject: '',
        photoUrl: ''
      });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (teacher) {
      setFormData({
        name: teacher.name || '',
        department: teacher.department || '',
        subject: teacher.subject || '',
        photoUrl: teacher.photoUrl || ''
      });
    }
  }, [teacher]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (teacher) {
        // Update existing teacher
        await teachersAPI.update(teacher.id, {
          name: formData.name,
          department: formData.department,
          subject: formData.subject,
          photoUrl: formData.photoUrl
        });
      } else {
        // Create new teacher
        await teachersAPI.create({
          name: formData.name,
          department: formData.department,
          subject: formData.subject,
          photoUrl: formData.photoUrl
        });
      }
      onSave();
    } catch (error) {
      console.error('Failed to save teacher:', error);
      alert(error.message || 'Failed to save teacher');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in border border-blue-100 dark:border-gray-700">
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-blue-600 dark:to-cyan-600 border-b border-blue-200 dark:border-gray-600 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-xl font-bold text-white">
            {teacher ? 'Edit Teacher' : 'Add Teacher'}
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
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Department *
            </label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subject *
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
            />
          </div>


          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Photo URL (optional)
            </label>
            <input
              type="url"
              value={formData.photoUrl}
              onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-2xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-2xl transition-all duration-300 font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Saving...</span>
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
