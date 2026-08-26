require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const username = 'superadmin';
  const password = 'password123';
  const hashed = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({ where: { username } });

  if (existing) {
    const updated = await prisma.user.update({
      where: { username },
      data: {
        password: hashed,
        role: 'SUPERADMIN',
        store_id: null,
        locked_until: null,
        failed_attempts: 0
      }
    });
    console.log(`Usuario "${username}" actualizado (id: ${updated.id}, role: ${updated.role}, store_id: ${updated.store_id})`);
  } else {
    const created = await prisma.user.create({
      data: {
        name: 'Super Administrador',
        email: 'superadmin@shop-mg.com',
        username,
        password: hashed,
        role: 'SUPERADMIN',
      }
    });
    console.log(`Usuario "${username}" creado (id: ${created.id}, role: ${created.role})`);
  }

  console.log('Credenciales: superadmin / password123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
