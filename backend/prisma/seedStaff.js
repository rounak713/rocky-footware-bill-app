require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const staffEmail = 'staff@shop.com';
  const existing = await prisma.user.findUnique({ where: { email: staffEmail } });

  if (!existing) {
    const passwordHash = await bcrypt.hash('staff123', 12);
    await prisma.user.create({
      data: {
        name: 'Shop Cashier',
        email: staffEmail,
        passwordHash,
        role: 'STAFF'
      }
    });
    console.log('✅ STAFF user seeded: staff@shop.com / staff123');
  } else {
    console.log('⚡ STAFF user already exists. Skipping.');
  }

  // Also ensure admin exists just in case
  const adminEmail = 'admin@shop.com';
  const adminExisting = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!adminExisting) {
    const adminHash = await bcrypt.hash('admin123', 12);
    await prisma.user.create({
      data: {
        name: 'Admin Owner',
        email: adminEmail,
        passwordHash: adminHash,
        role: 'ADMIN'
      }
    });
    console.log('✅ ADMIN user seeded: admin@shop.com / admin123');
  } else {
    // Force admin to have ADMIN role if somehow changed
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: 'ADMIN' }
    });
    console.log('⚡ ADMIN user updated/verified.');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
