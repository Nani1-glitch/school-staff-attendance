// Frontend-only API service using IndexedDB
import * as db from './database.js';
import { calculateAttendanceMetrics } from '../utils/attendance.js';
import dayjs from 'dayjs';

// Initialize database on first import (don't await to avoid blocking)
db.initDB().then(() => {
  db.initializeDefaultData().catch(console.error);
}).catch(console.error);

// Auth API
export const authAPI = {
  async login(phoneOrEmail, pin, rememberDevice) {
    const bcrypt = await import('bcryptjs');
    const user = await db.getUserByEmail(phoneOrEmail);
    if (!user || !user.active) {
      throw new Error('Invalid credentials');
    }

    const isValidPin = await bcrypt.default.compare(pin, user.pinHash);
    if (!isValidPin) {
      throw new Error('Invalid credentials');
    }

    return {
      token: 'local_token', // Not needed for frontend-only
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        phoneOrEmail: user.phoneOrEmail
      }
    };
  },

  async getCurrentUser() {
    const stored = JSON.parse(localStorage.getItem('auth') || '{}');
    if (stored?.user) {
      const user = await db.getUserByEmail(stored.user.phoneOrEmail).catch(() => null);
      if (user) {
        return {
          id: user.id,
          name: user.name,
          role: user.role,
          phoneOrEmail: user.phoneOrEmail
        };
      }
    }
    throw new Error('Not authenticated');
  }
};

// Teachers API
export const teachersAPI = {
  async getAll() {
    const teachers = await db.getAllTeachers();
    return teachers;
  },

  async getById(id) {
    return await db.getTeacher(id);
  },

  async create(teacherData) {
    return await db.createTeacher(teacherData);
  },

  async update(id, updates) {
    return await db.updateTeacher(id, updates);
  },

  async delete(id) {
    const teacher = await db.getTeacher(id);
    await db.updateTeacher(id, { active: false });
    return { message: 'Teacher deactivated successfully' };
  }
};

// Attendance API
export const attendanceAPI = {
  async getToday() {
    const records = await db.getTodayAttendance();
    return records;
  },

  async getByDate(date) {
    return await db.getAttendanceByDate(date);
  },

  async markAttendance(data) {
    const { teacherId, date, status, timeIn, timeOut, notes } = data;
    const settings = await db.getSettings();
    
    let metrics = { lateMinutes: 0, earlyMinutes: 0, totalMinutes: null };
    
    if (timeIn && timeOut) {
      metrics = calculateAttendanceMetrics(
        timeIn,
        timeOut,
        settings.startTime || '09:00',
        settings.endTime || '17:00',
        settings.graceMinutes || 15,
        settings.halfDayMinutes || 240
      );
    } else if (timeIn) {
      metrics = calculateAttendanceMetrics(
        timeIn,
        null,
        settings.startTime || '09:00',
        settings.endTime || '17:00',
        settings.graceMinutes || 15
      );
    }

    // Get today's date in Indian timezone if not provided
    let dateToUse = date;
    if (!dateToUse) {
      const now = new Date();
      const indianDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      dateToUse = indianDate.toISOString().split('T')[0];
    }

    return await db.createOrUpdateAttendance({
      teacherId,
      date: dateToUse,
      status,
      timeIn: timeIn || null,
      timeOut: timeOut || null,
      totalMinutes: metrics.totalMinutes,
      lateMinutes: metrics.lateMinutes,
      earlyMinutes: metrics.earlyMinutes,
      notes: notes || null
    });
  },

  async updateAttendance(recordId, data) {
    const existing = await db.getAttendanceByTeacherAndDate(data.teacherId, data.date);
    if (!existing) {
      throw new Error('Record not found');
    }

    const settings = await db.getSettings();
    let metrics = { lateMinutes: 0, earlyMinutes: 0, totalMinutes: null };
    
    if (data.timeIn && data.timeOut) {
      metrics = calculateAttendanceMetrics(
        data.timeIn,
        data.timeOut,
        settings.startTime || '09:00',
        settings.endTime || '17:00',
        settings.graceMinutes || 15,
        settings.halfDayMinutes || 240
      );
    } else if (data.timeIn) {
      metrics = calculateAttendanceMetrics(
        data.timeIn,
        null,
        settings.startTime || '09:00',
        settings.endTime || '17:00',
        settings.graceMinutes || 15
      );
    }

    return await db.createOrUpdateAttendance({
      ...existing,
      ...data,
      totalMinutes: metrics.totalMinutes,
      lateMinutes: metrics.lateMinutes,
      earlyMinutes: metrics.earlyMinutes
    });
  },

  async getTodayStats() {
    // Get today's date in Indian timezone
    const now = new Date();
    const indianDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const today = indianDate.toISOString().split('T')[0];
    const records = await db.getTodayAttendance();
    const teachers = await db.getAllTeachers();
    
    const stats = {
      PRESENT: 0,
      ABSENT: 0,
      LEAVE: 0,
      HALF_DAY: 0,
      NOT_MARKED: 0
    };

    records.forEach(r => {
      stats[r.status] = (stats[r.status] || 0) + 1;
    });

    const totalTeachers = teachers.length;
    const markedCount = records.length;
    stats.NOT_MARKED = totalTeachers - markedCount;

    return stats;
  }
};

// Reports API
export const reportsAPI = {
  async getRecords(filters = {}) {
    const records = await db.getAttendanceRecords(filters);
    const teachers = await db.getAllTeachers();
    
    return records.map(record => {
      const teacher = teachers.find(t => t.id === record.teacherId);
      return {
        ...record,
        teacher: teacher ? {
          id: teacher.id,
          name: teacher.name,
          department: teacher.department,
          subject: teacher.subject
        } : null
      };
    });
  },

  async getStats(filters = {}) {
    const records = await db.getAttendanceRecords(filters);
    
    const totalDays = records.length;
    const presentDays = records.filter(r => r.status === 'PRESENT').length;
    const absentDays = records.filter(r => r.status === 'ABSENT').length;
    const leaveDays = records.filter(r => r.status === 'LEAVE').length;
    const halfDays = records.filter(r => r.status === 'HALF_DAY').length;

    const totalLateMinutes = records.reduce((sum, r) => sum + (r.lateMinutes || 0), 0);
    const totalEarlyMinutes = records.reduce((sum, r) => sum + (r.earlyMinutes || 0), 0);
    const totalWorkedMinutes = records.reduce((sum, r) => sum + (r.totalMinutes || 0), 0);

    const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    return {
      totalDays,
      presentDays,
      absentDays,
      leaveDays,
      halfDays,
      attendancePercentage: Math.round(attendancePercentage * 100) / 100,
      totalLateMinutes,
      totalEarlyMinutes,
      totalWorkedMinutes,
      averageWorkedMinutes: totalDays > 0 ? Math.round(totalWorkedMinutes / totalDays) : 0
    };
  },

  async exportCSV(filters = {}) {
    const records = await this.getRecords(filters);
    
    const headers = ['Date', 'Teacher', 'Department', 'Subject', 'Status', 'Time In', 'Time Out', 'Total Hours', 'Late (min)', 'Early (min)', 'Notes'];
    const rows = records.map(r => [
      r.date,
      r.teacher?.name || '',
      r.teacher?.department || '',
      r.teacher?.subject || '',
      r.status,
      r.timeIn || '',
      r.timeOut || '',
      r.totalMinutes ? `${Math.floor(r.totalMinutes / 60)}h ${r.totalMinutes % 60}m` : '',
      r.lateMinutes || 0,
      r.earlyMinutes || 0,
      r.notes || ''
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    return csv;
  }
};

// Settings API
export const settingsAPI = {
  async get() {
    return await db.getSettings();
  },

  async update(settings) {
    return await db.updateSettings(settings);
  }
};
