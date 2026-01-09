import express from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get school settings
router.get('/', authenticate, async (req, res, next) => {
  try {
    let settings = await prisma.schoolSettings.findFirst();

    if (!settings) {
      // Create default settings if none exist
      settings = await prisma.schoolSettings.create({
        data: {}
      });
    }

    res.json(settings);
  } catch (error) {
    next(error);
  }
});

// Update school settings
router.put('/',
  authenticate,
  [
    body('startTime').optional().matches(/^\d{2}:\d{2}$/).withMessage('Start time must be HH:mm format'),
    body('endTime').optional().matches(/^\d{2}:\d{2}$/).withMessage('End time must be HH:mm format'),
    body('graceMinutes').optional().isInt({ min: 0 }).withMessage('Grace minutes must be a positive integer'),
    body('halfDayMinutes').optional().isInt({ min: 0 }).withMessage('Half day minutes must be a positive integer'),
    body('timezone').optional().isString(),
    body('weekendDays').optional().isString()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { startTime, endTime, graceMinutes, halfDayMinutes, timezone, weekendDays } = req.body;

      let settings = await prisma.schoolSettings.findFirst();

      const updateData = {};
      if (startTime !== undefined) updateData.startTime = startTime;
      if (endTime !== undefined) updateData.endTime = endTime;
      if (graceMinutes !== undefined) updateData.graceMinutes = graceMinutes;
      if (halfDayMinutes !== undefined) updateData.halfDayMinutes = halfDayMinutes;
      if (timezone !== undefined) updateData.timezone = timezone;
      if (weekendDays !== undefined) updateData.weekendDays = weekendDays;

      if (settings) {
        settings = await prisma.schoolSettings.update({
          where: { id: settings.id },
          data: updateData
        });
      } else {
        settings = await prisma.schoolSettings.create({
          data: updateData
        });
      }

      res.json(settings);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
