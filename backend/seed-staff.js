const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function seedStaff() {
  try {
    const email = 'staff@rockyfootwear.com';
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log('Staff user already exists!');
      return;
    }

    const passwordHash = await bcrypt.hash('staff123', 12);
    await prisma.user.create({
      data: {
        name: 'Main Staff',
        email,
        passwordHash,
        role: 'STAFF'
      }
    });
    console.log('Default staff user created successfully:');
    console.log(`Email: ${email}`);
    console.log('Password: staff123');
  } catch (err) {
    console.error('Failed to create staff user:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

seedStaff();
