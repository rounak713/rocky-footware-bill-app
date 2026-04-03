const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDb() {
  try {
    const count = await prisma.user.count();
    console.log(`Database is working! There are ${count} users.`);
    if (count === 0) {
      console.log('No users found. Creating a default admin user...');
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash('admin123', 12);
      await prisma.user.create({
        data: {
          name: 'Admin',
          email: 'admin@rockyfootwear.com',
          passwordHash,
          role: 'ADMIN'
        }
      });
      console.log('Default admin user created: admin@rockyfootwear.com / admin123');
    }
  } catch (err) {
    console.error('Database connection failed:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}
checkDb();
