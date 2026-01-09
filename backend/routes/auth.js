import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Login
router.post('/login',
  [
    body('phoneOrEmail').notEmpty().withMessage('Phone or email is required'),
    body('pin').isLength({ min: 4, max: 6 }).withMessage('PIN must be 4-6 digits')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { phoneOrEmail, pin, rememberDevice } = req.body;

      const user = await prisma.user.findUnique({
        where: { phoneOrEmail },
        include: { teacherProfile: true }
      });

      if (!user || !user.active) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPin = await bcrypt.compare(pin, user.pinHash);
      if (!isValidPin) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: rememberDevice ? '30d' : process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          phoneOrEmail: user.phoneOrEmail,
          teacherId: user.teacherProfile?.id
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get current user
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { teacherProfile: true }
    });

    res.json({
      id: user.id,
      name: user.name,
      role: user.role,
      phoneOrEmail: user.phoneOrEmail,
      teacherId: user.teacherProfile?.id
    });
  } catch (error) {
    next(error);
  }
});

// Change PIN
router.post('/change-pin',
  authenticate,
  [
    body('oldPin').notEmpty().withMessage('Old PIN is required'),
    body('newPin').isLength({ min: 4, max: 6 }).withMessage('New PIN must be 4-6 digits')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { oldPin, newPin } = req.body;
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });

      const isValidPin = await bcrypt.compare(oldPin, user.pinHash);
      if (!isValidPin) {
        return res.status(401).json({ error: 'Invalid old PIN' });
      }

      const newPinHash = await bcrypt.hash(newPin, 10);
      await prisma.user.update({
        where: { id: req.user.id },
        data: { pinHash: newPinHash }
      });

      res.json({ message: 'PIN changed successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
