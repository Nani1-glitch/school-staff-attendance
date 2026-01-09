import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPinHash = await bcrypt.hash('1234', 10);
  const admin = await prisma.user.upsert({
    where: { phoneOrEmail: 'admin@school.com' },
    update: {},
    create: {
      name: 'Admin User',
      role: 'ADMIN',
      phoneOrEmail: 'admin@school.com',
      pinHash: adminPinHash,
      active: true
    }
  });

  console.log('✅ Created admin user (admin@school.com, PIN: 1234)');

  // Create default school settings
  await prisma.schoolSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      startTime: '09:00',
      endTime: '17:00',
      graceMinutes: 15,
      halfDayMinutes: 240,
      timezone: 'UTC',
      weekendDays: 'Saturday,Sunday'
    }
  });

  console.log('✅ Created school settings');

  console.log('🎉 Seeding completed!');
  console.log('📝 Note: Add teachers through the Settings page in the app.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
