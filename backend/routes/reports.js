import express from 'express';
import { query, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import PDFDocument from 'pdfkit';

const router = express.Router();
const prisma = new PrismaClient();

// Get attendance records with filters
router.get('/',
  authenticate,
  [
    query('startDate').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
    query('endDate').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
    query('teacherId').optional().isUUID(),
    query('department').optional().isString(),
    query('status').optional().isIn(['PRESENT', 'ABSENT', 'LEAVE', 'HALF_DAY', 'NOT_MARKED'])
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { startDate, endDate, teacherId, department, status } = req.query;

      let teacherIds = null;
      if (teacherId) {
        teacherIds = [teacherId];
      }

      const where = {
        ...(teacherIds && { teacherId: { in: teacherIds } }),
        ...(status && { status }),
        ...(startDate || endDate ? {
          date: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate })
          }
        } : {})
      };

      // If filtering by department, need to join with Teacher
      let records;
      if (department) {
        const teachers = await prisma.teacher.findMany({
          where: { department, active: true },
          select: { id: true }
        });
        const deptTeacherIds = teachers.map(t => t.id);
        where.teacherId = { in: deptTeacherIds };
      }

      records = await prisma.attendanceRecord.findMany({
        where,
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              department: true,
              subject: true
            }
          },
          editor: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: [
          { date: 'desc' },
          { teacher: { name: 'asc' } }
        ]
      });

      res.json(records);
    } catch (error) {
      next(error);
    }
  }
);

// Get attendance statistics
router.get('/stats',
  authenticate,
  [
    query('startDate').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
    query('endDate').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
    query('teacherId').optional().isUUID()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { startDate, endDate, teacherId } = req.query;

      let teacherIds = null;
      if (teacherId) {
        teacherIds = [teacherId];
      }

      const where = {
        ...(teacherIds && { teacherId: { in: teacherIds } }),
        ...(startDate || endDate ? {
          date: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate })
          }
        } : {})
      };

      const records = await prisma.attendanceRecord.findMany({
        where,
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              department: true
            }
          }
        }
      });

      // Calculate statistics
      const totalDays = records.length;
      const presentDays = records.filter(r => r.status === 'PRESENT').length;
      const absentDays = records.filter(r => r.status === 'ABSENT').length;
      const leaveDays = records.filter(r => r.status === 'LEAVE').length;
      const halfDays = records.filter(r => r.status === 'HALF_DAY').length;

      const totalLateMinutes = records.reduce((sum, r) => sum + r.lateMinutes, 0);
      const totalEarlyMinutes = records.reduce((sum, r) => sum + r.earlyMinutes, 0);
      const totalWorkedMinutes = records.reduce((sum, r) => sum + (r.totalMinutes || 0), 0);

      const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

      res.json({
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
      });
    } catch (error) {
      next(error);
    }
  }
);

// Export CSV
router.get('/export/csv',
  authenticate,
  [
    query('startDate').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
    query('endDate').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
    query('teacherId').optional().isUUID()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { startDate, endDate, teacherId } = req.query;

      let teacherIds = null;
      if (teacherId) {
        teacherIds = [teacherId];
      }

      const where = {
        ...(teacherIds && { teacherId: { in: teacherIds } }),
        ...(startDate || endDate ? {
          date: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate })
          }
        } : {})
      };

      const records = await prisma.attendanceRecord.findMany({
        where,
        include: {
          teacher: {
            select: {
              name: true,
              department: true,
              subject: true
            }
          }
        },
        orderBy: [
          { date: 'desc' },
          { teacher: { name: 'asc' } }
        ]
      });

      // Generate CSV
      const headers = ['Date', 'Teacher', 'Department', 'Subject', 'Status', 'Time In', 'Time Out', 'Total Hours', 'Late (min)', 'Early (min)', 'Notes'];
      const rows = records.map(r => [
        r.date,
        r.teacher.name,
        r.teacher.department,
        r.teacher.subject,
        r.status,
        r.timeIn || '',
        r.timeOut || '',
        r.totalMinutes ? `${Math.floor(r.totalMinutes / 60)}h ${r.totalMinutes % 60}m` : '',
        r.lateMinutes,
        r.earlyMinutes,
        r.notes || ''
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=attendance-${dayjs().format('YYYY-MM-DD')}.csv`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }
);

// Export PDF
router.get('/export/pdf',
  authenticate,
  [
    query('startDate').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
    query('endDate').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
    query('teacherId').optional().isUUID()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { startDate, endDate, teacherId } = req.query;

      let teacherIds = null;
      if (teacherId) {
        teacherIds = [teacherId];
      }

      const where = {
        ...(teacherIds && { teacherId: { in: teacherIds } }),
        ...(startDate || endDate ? {
          date: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate })
          }
        } : {})
      };

      const records = await prisma.attendanceRecord.findMany({
        where,
        include: {
          teacher: {
            select: {
              name: true,
              department: true,
              subject: true
            }
          }
        },
        orderBy: [
          { date: 'desc' },
          { teacher: { name: 'asc' } }
        ]
      });

      // Generate PDF
      const doc = new PDFDocument({ margin: 50 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=attendance-${dayjs().format('YYYY-MM-DD')}.pdf`);

      doc.pipe(res);

      doc.fontSize(20).text('Attendance Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Generated: ${dayjs().format('MMMM D, YYYY h:mm A')}`, { align: 'center' });
      if (startDate || endDate) {
        doc.text(`Period: ${startDate || 'Start'} to ${endDate || 'End'}`, { align: 'center' });
      }
      doc.moveDown(2);

      // Table headers
      const tableTop = doc.y;
      doc.fontSize(10);
      doc.text('Date', 50, tableTop);
      doc.text('Teacher', 120, tableTop);
      doc.text('Dept', 220, tableTop);
      doc.text('Status', 280, tableTop);
      doc.text('Time In', 340, tableTop);
      doc.text('Time Out', 400, tableTop);
      doc.text('Hours', 460, tableTop);

      let y = tableTop + 20;
      records.forEach((record, index) => {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }

        doc.text(record.date, 50, y);
        doc.text(record.teacher.name.substring(0, 15), 120, y);
        doc.text(record.teacher.department.substring(0, 10), 220, y);
        doc.text(record.status, 280, y);
        doc.text(record.timeIn || '-', 340, y);
        doc.text(record.timeOut || '-', 400, y);
        doc.text(record.totalMinutes ? `${Math.floor(record.totalMinutes / 60)}h` : '-', 460, y);

        y += 15;
      });

      doc.end();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
