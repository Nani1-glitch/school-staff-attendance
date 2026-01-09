import express from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all active teachers
router.get('/', authenticate, async (req, res, next) => {
  try {
    const teachers = await prisma.teacher.findMany({
      where: { active: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phoneOrEmail: true,
            role: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json(teachers);
  } catch (error) {
    next(error);
  }
});

// Get single teacher
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phoneOrEmail: true,
            role: true
          }
        }
      }
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    res.json(teacher);
  } catch (error) {
    next(error);
  }
});

// Create teacher
router.post('/',
  authenticate,
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('department').notEmpty().withMessage('Department is required'),
    body('subject').notEmpty().withMessage('Subject is required')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, department, subject, photoUrl } = req.body;

      // Create a dummy user for teacher (teachers don't login, but schema requires userId)
      const dummyUser = await prisma.user.create({
        data: {
          name,
          role: 'TEACHER',
          phoneOrEmail: `teacher_${Date.now()}@school.com`,
          pinHash: await bcrypt.hash('0000', 10), // Dummy PIN
          active: false // Inactive since they don't login
        }
      });

      const teacher = await prisma.teacher.create({
        data: {
          userId: dummyUser.id,
          name,
          department,
          subject,
          photoUrl: photoUrl || null
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phoneOrEmail: true,
              role: true
            }
          }
        }
      });

      res.status(201).json(teacher);
    } catch (error) {
      next(error);
    }
  }
);

// Update teacher
router.put('/:id',
  authenticate,
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('department').optional().notEmpty().withMessage('Department cannot be empty'),
    body('subject').optional().notEmpty().withMessage('Subject cannot be empty')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { name, department, subject, photoUrl, active } = req.body;

      const teacher = await prisma.teacher.findUnique({
        where: { id }
      });

      if (!teacher) {
        return res.status(404).json({ error: 'Teacher not found' });
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (department !== undefined) updateData.department = department;
      if (subject !== undefined) updateData.subject = subject;
      if (photoUrl !== undefined) updateData.photoUrl = photoUrl;
      if (active !== undefined) updateData.active = active;

      const updated = await prisma.teacher.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phoneOrEmail: true,
              role: true
            }
          }
        }
      });

      // Also update user if name changed
      if (name && name !== teacher.name) {
        await prisma.user.update({
          where: { id: teacher.userId },
          data: { name }
        });
      }

      // Update user active status
      if (active !== undefined) {
        await prisma.user.update({
          where: { id: teacher.userId },
          data: { active }
        });
      }

      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
);

// Delete teacher (soft delete)
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const teacher = await prisma.teacher.findUnique({
      where: { id }
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    await prisma.teacher.update({
      where: { id },
      data: { active: false }
    });

    await prisma.user.update({
      where: { id: teacher.userId },
      data: { active: false }
    });

    res.json({ message: 'Teacher deactivated successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
