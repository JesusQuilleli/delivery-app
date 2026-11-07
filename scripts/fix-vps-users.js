const { runSSHCommand } = require('./vps-manager');

async function fixUsers() {
  const script = `
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const superHash = await bcrypt.hash('SuperAdmin2026!', 10);
  const adminHash = await bcrypt.hash('Admin123!', 10);

  // 1. Asegurar SuperAdmin principal (jqcelis092@gmail.com)
  const u1 = await prisma.user.updateMany({
    where: { email: 'jqcelis092@gmail.com' },
    data: {
      username: 'jqcelis092',
      password: superHash,
      role: 'SUPERADMIN',
      failed_attempts: 0,
      locked_until: null
    }
  });
  console.log('Updated jqcelis092:', u1.count);

  // 2. Asegurar admin demo (admin@demo.com / admin_demo)
  const u2 = await prisma.user.updateMany({
    where: { OR: [{ email: 'admin@demo.com' }, { username: 'admin_demo' }] },
    data: {
      username: 'admin_demo',
      email: 'admin@demo.com',
      password: adminHash,
      role: 'ADMIN',
      failed_attempts: 0,
      locked_until: null
    }
  });
  console.log('Updated admin_demo:', u2.count);

  // 3. Asegurar superadmin demo
  const u3 = await prisma.user.updateMany({
    where: { username: 'superadmin' },
    data: {
      password: superHash,
      role: 'SUPERADMIN',
      failed_attempts: 0,
      locked_until: null
    }
  });
  console.log('Updated superadmin:', u3.count);

  const all = await prisma.user.findMany({ select: { id: true, username: true, email: true, role: true } });
  console.log('ALL USERS NOW:', all);
}

run().then(() => prisma.$disconnect()).catch(console.error);
  `;

  const b64 = Buffer.from(script).toString('base64');
  const res = await runSSHCommand(`docker exec delivery_api node -e "eval(Buffer.from('${b64}', 'base64').toString())"`);
  console.log('FIX RESULT:\n', res);
}

fixUsers().catch(console.error);
