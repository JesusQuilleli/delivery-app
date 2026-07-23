const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('superadmin123', 10);
  await prisma.user.updateMany({
    where: { username: 'superadmin' },
    data: { password: hashedPassword }
  });
  console.log('Superadmin password updated to superadmin123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
