const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const stores = await prisma.store.findMany({
    select: { id: true, slug: true, name: true, industry: true, is_active: true }
  });
  const admins = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'SUPERADMIN'] } },
    select: {
      id: true,
      username: true,
      role: true,
      store_id: true,
      store: { select: { slug: true } }
    }
  });

  console.log(JSON.stringify({ stores, admins }, null, 2));
}

main()
  .catch((error) => {
    console.error('DB_ERROR:', error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
