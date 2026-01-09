import express from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { calculateAttendanceMetrics } from '../utils/attendance.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get today's attendance for all teachers
router.get('/today', authenticate, async (req, res, next) => {
  try {
    const today = dayjs().format('YYYY-MM-DD');

    const records = await prisma.attendanceRecord.findMany({
      where: {
        date: today
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            department: true,
            subject: true,
            photoUrl: true
          }
        }
      },
      orderBy: { teacher: { name: 'asc' } }
    });

    res.json(records);
  } catch (error) {
    next(error);
  }
});

// Get attendance for a specific date
router.get('/date/:date', authenticate, async (req, res, next) => {
  try {
    const { date } = req.params;

    const records = await prisma.attendanceRecord.findMany({
      where: {
        date
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            department: true,
            subject: true,
            photoUrl: true
          }
        }
      },
      orderBy: { teacher: { name: 'asc' } }
    });

    res.json(records);
  } catch (error) {
    next(error);
  }
});

// Teacher self check-in
router.post('/check-in', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'TEACHER') {
      return res.status(403).json({ error: 'Only teachers can check in' });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.user.id }
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher profile not found' });
    }

    const today = dayjs().format('YYYY-MM-DD');
    const timeIn = dayjs().format('HH:mm');

    // Check if already checked in today
    const existing = await prisma.attendanceRecord.findUnique({
      where: {
        teacherId_date: {
          teacherId: teacher.id,
          date: today
        }
      }
    });

    if (existing && existing.timeIn) {
      return res.status(400).json({ error: 'Already checked in today' });
    }

    const settings = await prisma.schoolSettings.findFirst();
    const metrics = calculateAttendanceMetrics(
      timeIn,
      null,
      settings?.startTime || '09:00',
      settings?.endTime || '17:00',
      settings?.graceMinutes || 15
    );

    const record = await prisma.attendanceRecord.upsert({
      where: {
        teacherId_date: {
          teacherId: teacher.id,
          date: today
        }
      },
      update: {
        timeIn,
        status: 'PRESENT',
        lateMinutes: metrics.lateMinutes,
        updatedAt: new Date()
      },
      create: {
        teacherId: teacher.id,
        date: today,
        status: 'PRESENT',
        timeIn,
        lateMinutes: metrics.lateMinutes
      }
    });

    res.json(record);
  } catch (error) {
    next(error);
  }
});

// Teacher self check-out
router.post('/check-out', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'TEACHER') {
      return res.status(403).json({ error: 'Only teachers can check out' });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.user.id }
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher profile not found' });
    }

    const today = dayjs().format('YYYY-MM-DD');
    const timeOut = dayjs().format('HH:mm');

    const existing = await prisma.attendanceRecord.findUnique({
      where: {
        teacherId_date: {
          teacherId: teacher.id,
          date: today
        }
      }
    });

    if (!existing || !existing.timeIn) {
      return res.status(400).json({ error: 'Must check in before checking out' });
    }

    if (existing.timeOut) {
      return res.status(400).json({ error: 'Already checked out today' });
    }

    const settings = await prisma.schoolSettings.findFirst();
    const metrics = calculateAttendanceMetrics(
      existing.timeIn,
      timeOut,
      settings?.startTime || '09:00',
      settings?.endTime || '17:00',
      settings?.graceMinutes || 15,
      settings?.halfDayMinutes || 240
    );

    const record = await prisma.attendanceRecord.update({
      where: {
        teacherId_date: {
          teacherId: teacher.id,
          date: today
        }
      },
      data: {
        timeOut,
        totalMinutes: metrics.totalMinutes,
        earlyMinutes: metrics.earlyMinutes,
        updatedAt: new Date()
      }
    });

    res.json(record);
  } catch (error) {
    next(error);
  }
});

// Admin: Mark attendance for a teacher
router.post('/mark',
  authenticate,
  requireAdmin,
  [
    body('teacherId').notEmpty().withMessage('Teacher ID is required'),
    body('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be YYYY-MM-DD'),
    body('status').isIn(['PRESENT', 'ABSENT', 'LEAVE', 'HALF_DAY', 'NOT_MARKED']).withMessage('Invalid status')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { teacherId, date, status, timeIn, timeOut, notes } = req.body;

      const teacher = await prisma.teacher.findUnique({
        where: { id: teacherId }
      });

      if (!teacher) {
        return res.status(404).json({ error: 'Teacher not found' });
      }

      const settings = await prisma.schoolSettings.findFirst();
      let metrics = { lateMinutes: 0, earlyMinutes: 0, totalMinutes: null };

      if (timeIn && timeOut) {
        metrics = calculateAttendanceMetrics(
          timeIn,
          timeOut,
          settings?.startTime || '09:00',
          settings?.endTime || '17:00',
          settings?.graceMinutes || 15,
          settings?.halfDayMinutes || 240
        );
      } else if (timeIn) {
        metrics = calculateAttendanceMetrics(
          timeIn,
          null,
          settings?.startTime || '09:00',
          settings?.endTime || '17:00',
          settings?.graceMinutes || 15
        );
      }

      const record = await prisma.attendanceRecord.upsert({
        where: {
          teacherId_date: {
            teacherId,
            date
          }
        },
        update: {
          status,
          timeIn: timeIn || null,
          timeOut: timeOut || null,
          totalMinutes: metrics.totalMinutes,
          lateMinutes: metrics.lateMinutes,
          earlyMinutes: metrics.earlyMinutes,
          notes: notes || null,
          updatedAt: new Date()
        },
        create: {
          teacherId,
          date,
          status,
          timeIn: timeIn || null,
          timeOut: timeOut || null,
          totalMinutes: metrics.totalMinutes,
          lateMinutes: metrics.lateMinutes,
          earlyMinutes: metrics.earlyMinutes,
          notes: notes || null
        }
      });

      res.json(record);
    } catch (error) {
      next(error);
    }
  }
);

// Edit attendance record
router.put('/:recordId',
  authenticate,
  [
    body('status').isIn(['PRESENT', 'ABSENT', 'LEAVE', 'HALF_DAY', 'NOT_MARKED']).withMessage('Invalid status'),
    body('editReason').notEmpty().withMessage('Edit reason is required')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { recordId } = req.params;
      const { status, timeIn, timeOut, notes, editReason } = req.body;

      const existing = await prisma.attendanceRecord.findUnique({
        where: { id: recordId }
      });

      if (!existing) {
        return res.status(404).json({ error: 'Record not found' });
      }

      const settings = await prisma.schoolSettings.findFirst();
      let metrics = { lateMinutes: 0, earlyMinutes: 0, totalMinutes: null };

      if (timeIn && timeOut) {
        metrics = calculateAttendanceMetrics(
          timeIn,
          timeOut,
          settings?.startTime || '09:00',
          settings?.endTime || '17:00',
          settings?.graceMinutes || 15,
          settings?.halfDayMinutes || 240
        );
      } else if (timeIn) {
        metrics = calculateAttendanceMetrics(
          timeIn,
          null,
          settings?.startTime || '09:00',
          settings?.endTime || '17:00',
          settings?.graceMinutes || 15
        );
      }

      const record = await prisma.attendanceRecord.update({
        where: { id: recordId },
        data: {
          status,
          timeIn: timeIn || null,
          timeOut: timeOut || null,
          totalMinutes: metrics.totalMinutes,
          lateMinutes: metrics.lateMinutes,
          earlyMinutes: metrics.earlyMinutes,
          notes: notes || null,
          editedBy: req.user.id,
          editReason,
          updatedAt: new Date()
        }
      });

      res.json(record);
    } catch (error) {
      next(error);
    }
  }
);

// Get attendance stats for today
router.get('/stats/today', authenticate, async (req, res, next) => {
  try {
    const today = dayjs().format('YYYY-MM-DD');

    const stats = await prisma.attendanceRecord.groupBy({
      by: ['status'],
      where: { date: today },
      _count: { status: true }
    });

    const totalTeachers = await prisma.teacher.count({ where: { active: true } });
    const markedCount = stats.reduce((sum, s) => sum + s._count.status, 0);
    const notMarked = totalTeachers - markedCount;

    const result = {
      PRESENT: 0,
      ABSENT: 0,
      LEAVE: 0,
      HALF_DAY: 0,
      NOT_MARKED: notMarked
    };

    stats.forEach(s => {
      result[s.status] = s._count.status;
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
