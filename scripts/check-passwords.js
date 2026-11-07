const { runSSHCommand } = require('./vps-manager');

async function testPass() {
  const script = `
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany();
  for (const u of users) {
    if (!u.password) continue;
    const testSuper = await bcrypt.compare('SuperAdmin2026!', u.password);
    const testAdmin = await bcrypt.compare('Admin123!', u.password);
    console.log(\`User \${u.id} (\${u.email} / \${u.username}): SuperAdmin2026! = \${testSuper}, Admin123! = \${testAdmin}\`);
  }
}
run().then(() => prisma.$disconnect());
  `;

  const b64 = Buffer.from(script).toString('base64');
  const res = await runSSHCommand(`docker exec delivery_api node -e "eval(Buffer.from('${b64}', 'base64').toString())"`);
  console.log('PASSWORD CHECK:\n', res);
}

testPass().catch(console.error);
