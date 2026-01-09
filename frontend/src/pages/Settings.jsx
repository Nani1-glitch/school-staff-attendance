import { useState, useEffect } from 'react';
import { teachersAPI, settingsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { Save, Plus, Edit2, Trash2 } from 'lucide-react';
import TeacherModal from '../components/TeacherModal';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teacherModalOpen, setTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [settingsData, teachersData] = await Promise.all([
        settingsAPI.get(),
        teachersAPI.getAll()
      ]);
      setSettings(settingsData);
      setTeachers(teachersData);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await settingsAPI.update(settings);
      setSettings(updated);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (!confirm('Are you sure you want to deactivate this teacher?')) {
      return;
    }

    try {
      await teachersAPI.delete(teacherId);
      await loadData();
    } catch (error) {
      console.error('Failed to delete teacher:', error);
      alert('Failed to delete teacher');
    }
  };

  const handleEditTeacher = (teacher) => {
    setEditingTeacher(teacher);
    setTeacherModalOpen(true);
  };

  const handleAddTeacher = () => {
    setEditingTeacher(null);
    setTeacherModalOpen(true);
  };

  const handleTeacherSaved = () => {
    setTeacherModalOpen(false);
    setEditingTeacher(null);
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-6">
      <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-cyan-400 animate-slide-up">Settings</h2>

      {/* School Settings */}
      <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-3xl shadow-lg p-6 border border-blue-100 dark:border-gray-700 hover-lift animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-5">
          School Timings
        </h3>
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Time
              </label>
              <input
                type="time"
                value={settings?.startTime || '09:00'}
                onChange={(e) => setSettings({ ...settings, startTime: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Time
              </label>
              <input
                type="time"
                value={settings?.endTime || '17:00'}
                onChange={(e) => setSettings({ ...settings, endTime: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Grace Period (minutes)
              </label>
              <input
                type="number"
                value={settings?.graceMinutes || 15}
                onChange={(e) => setSettings({ ...settings, graceMinutes: parseInt(e.target.value) })}
                min="0"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Half Day Threshold (minutes)
              </label>
              <input
                type="number"
                value={settings?.halfDayMinutes || 240}
                onChange={(e) => setSettings({ ...settings, halfDayMinutes: parseInt(e.target.value) })}
                min="0"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Weekend Days (comma-separated)
            </label>
            <input
              type="text"
              value={settings?.weekendDays || 'Saturday,Sunday'}
              onChange={(e) => setSettings({ ...settings, weekendDays: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Saturday,Sunday"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
          >
            {saving ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Teachers Management */}
      <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-3xl shadow-lg p-6 border border-blue-100 dark:border-gray-700 hover-lift animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Teachers</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">
              Add teachers who will call you for attendance
            </p>
          </div>
          <button
            onClick={handleAddTeacher}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-5 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            Add Teacher
          </button>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
          {teachers.map((teacher, index) => (
            <div
              key={teacher.id}
              className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-blue-50 dark:from-gray-700 dark:to-gray-800 rounded-2xl border border-blue-100 dark:border-gray-600 hover-lift animate-slide-up"
              style={{ animationDelay: `${0.3 + index * 0.05}s` }}
            >
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">{teacher.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {teacher.department} • {teacher.subject}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditTeacher(teacher)}
                  className="p-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-2xl transition-all duration-300 transform hover:scale-110 shadow-md"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteTeacher(teacher.id)}
                  className="p-2.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-2xl transition-all duration-300 transform hover:scale-110 shadow-md"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {teacherModalOpen && (
        <TeacherModal
          teacher={editingTeacher}
          onClose={() => {
            setTeacherModalOpen(false);
            setEditingTeacher(null);
          }}
          onSave={handleTeacherSaved}
        />
      )}
    </div>
  );
}
