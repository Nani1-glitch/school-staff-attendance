import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { teachersAPI, reportsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { Download, Filter, Calendar, CalendarDays } from 'lucide-react';

dayjs.extend(utc);
dayjs.extend(timezone);

export default function Reports() {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  // Helper to get Indian date string
  const getIndianDateStr = (date = new Date()) => {
    const indianDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    return indianDate.toISOString().split('T')[0];
  };

  const [filters, setFilters] = useState({
    startDate: (() => {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return getIndianDateStr(firstDay);
    })(),
    endDate: getIndianDateStr(),
    teacherId: '',
    department: '',
    status: '',
    selectedDate: null // For viewing specific day
  });
  const [teachers, setTeachers] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('range'); // 'range' or 'day'

  useEffect(() => {
    loadTeachers();
    loadReports();
  }, [filters]);

  const loadTeachers = async () => {
    try {
      const teachers = await teachersAPI.getAll();
      setTeachers(teachers);
    } catch (error) {
      console.error('Failed to load teachers:', error);
    }
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      let reportFilters = {};
      
      if (viewMode === 'day' && filters.selectedDate) {
        // For specific day view
        reportFilters = {
          startDate: filters.selectedDate,
          endDate: filters.selectedDate,
          teacherId: filters.teacherId || undefined,
          status: filters.status || undefined
        };
      } else {
        // For date range view
        reportFilters = {
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
          teacherId: filters.teacherId || undefined,
          status: filters.status || undefined
        };
      }

      // Filter by department if needed
      let allRecords = await reportsAPI.getRecords(reportFilters);
      if (filters.department) {
        const deptTeachers = teachers.filter(t => t.department === filters.department);
        const deptTeacherIds = deptTeachers.map(t => t.id);
        allRecords = allRecords.filter(r => deptTeacherIds.includes(r.teacherId));
      }

      const reportStats = await reportsAPI.getStats(reportFilters);

      setRecords(allRecords);
      setStats(reportStats);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const reportFilters = {
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        teacherId: filters.teacherId || undefined
      };

      const csv = await reportsAPI.exportCSV(reportFilters);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance-${dayjs().format('YYYY-MM-DD')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export CSV:', error);
      alert('Failed to export CSV');
    }
  };

  const handleExportPDF = async () => {
    try {
      // For PDF, we'll use jsPDF which is already in dependencies
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      const reportFilters = {
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        teacherId: filters.teacherId || undefined
      };
      
      const records = await reportsAPI.getRecords(reportFilters);
      
      doc.setFontSize(20);
      doc.text('Attendance Report', 105, 20, { align: 'center' });
      doc.setFontSize(12);
      doc.text(`Generated: ${dayjs().format('MMMM D, YYYY h:mm A')}`, 105, 30, { align: 'center' });
      
      let y = 50;
      doc.setFontSize(10);
      doc.text('Date', 20, y);
      doc.text('Teacher', 50, y);
      doc.text('Dept', 100, y);
      doc.text('Status', 130, y);
      doc.text('Time In', 160, y);
      doc.text('Time Out', 180, y);
      
      y += 10;
      records.forEach((record) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(record.date, 20, y);
        doc.text((record.teacher?.name || '').substring(0, 15), 50, y);
        doc.text((record.teacher?.department || '').substring(0, 10), 100, y);
        doc.text(record.status, 130, y);
        doc.text(record.timeIn || '-', 160, y);
        doc.text(record.timeOut || '-', 180, y);
        y += 7;
      });
      
      doc.save(`attendance-${dayjs().format('YYYY-MM-DD')}.pdf`);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to export PDF');
    }
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
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'ABSENT':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'LEAVE':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'HALF_DAY':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const departments = [...new Set(teachers.map((t) => t.department))];

  if (loading && !records.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between mb-6 animate-slide-up">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-cyan-400">Reports</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
          >
            <Filter className="w-5 h-5" />
          </button>
          <button
            onClick={handleExportCSV}
            className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
            title="Export CSV"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700 mb-4">
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => {
              setViewMode('range');
              setFilters({ ...filters, selectedDate: null });
            }}
            className={`flex-1 px-4 py-3 rounded-2xl font-bold transition-all duration-300 ${
              viewMode === 'range'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg transform scale-105'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Date Range
          </button>
          <button
            onClick={() => {
              const now = new Date();
              const indianDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
              const todayStr = indianDate.toISOString().split('T')[0];
              setViewMode('day');
              setFilters({ ...filters, selectedDate: todayStr });
            }}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'day'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Specific Day
          </button>
        </div>
        {viewMode === 'day' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Date
            </label>
            <input
              type="date"
              value={filters.selectedDate || (() => {
                const now = new Date();
                const indianDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
                return indianDate.toISOString().split('T')[0];
              })()}
              onChange={(e) => setFilters({ ...filters, selectedDate: e.target.value })}
              max={(() => {
                const now = new Date();
                const indianDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
                return indianDate.toISOString().split('T')[0];
              })()}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        )}
      </div>

      {showFilters && viewMode === 'range' && (
        <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-3xl shadow-lg p-5 border border-blue-100 dark:border-gray-700 space-y-4 animate-slide-up">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                max={(() => {
                  const now = new Date();
                  const indianDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
                  return indianDate.toISOString().split('T')[0];
                })()}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                max={(() => {
                  const now = new Date();
                  const indianDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
                  return indianDate.toISOString().split('T')[0];
                })()}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Teacher
            </label>
            <select
              value={filters.teacherId}
              onChange={(e) => setFilters({ ...filters, teacherId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Teachers</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Department
            </label>
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="LEAVE">Leave</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="NOT_MARKED">Not Marked</option>
            </select>
          </div>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Attendance %</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.attendancePercentage.toFixed(1)}%
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Days</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalDays}
            </div>
          </div>
        </div>
      )}

      {/* Group records by date */}
      {(() => {
        const groupedByDate = records.reduce((acc, record) => {
          const date = record.date;
          if (!acc[date]) {
            acc[date] = [];
          }
          acc[date].push(record);
          return acc;
        }, {});

        const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

        return (
          <div className="space-y-4">
            {sortedDates.map((date) => {
              const dateRecords = groupedByDate[date];
              const dateObj = dayjs(date);
              const dayName = dateObj.format('dddd'); // Day name
              const dateFormatted = dateObj.format('D MMM YYYY'); // Indian date format

              return (
                <div key={date} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {/* Date Header */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <CalendarDays className="w-6 h-6 text-white" />
                      <h3 className="font-bold text-white text-lg">
                        {dayName}, {dateFormatted}
                      </h3>
                      <span className="ml-auto text-sm text-white/90 font-semibold bg-white/20 px-3 py-1 rounded-2xl">
                        {dateRecords.length} record{dateRecords.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Records for this date */}
                  <div className="divide-y divide-blue-100 dark:divide-gray-700">
                    {dateRecords.map((record, recordIndex) => (
                      <div key={record.id} className="p-5 hover:bg-blue-50/50 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {record.teacher?.name || 'Unknown Teacher'}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {record.teacher?.department || ''} • {record.teacher?.subject || ''}
                            </p>
                          </div>
                          <span
                            className={`px-4 py-2 rounded-2xl text-xs font-bold shadow-md ${getStatusColor(
                              record.status
                            )}`}
                          >
                            {record.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Time In:</span>
                            <span className="ml-2 font-medium text-gray-900 dark:text-white">
                              {record.timeIn || '-'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Time Out:</span>
                            <span className="ml-2 font-medium text-gray-900 dark:text-white">
                              {record.timeOut || '-'}
                            </span>
                          </div>
                          {record.totalMinutes && (
                            <div className="col-span-2">
                              <span className="text-gray-600 dark:text-gray-400">Total Hours:</span>
                              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                {formatMinutes(record.totalMinutes)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {records.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No records found for the selected filters</p>
        </div>
      )}
    </div>
  );
}
