const { runSSHCommand } = require('./vps-manager');

async function testSuperAdmin() {
  const nodeSnippet = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('Testing store query with subscriptionPayments include...');
  const stores = await prisma.store.findMany({
    include: {
      _count: {
        select: { products: true, orders: true }
      },
      users: {
        where: { role: 'ADMIN' },
        select: { id: true, username: true, phone: true }
      },
      subscriptionPayments: {
        orderBy: { created_at: 'desc' },
        take: 1
      }
    },
    orderBy: { id: 'desc' }
  });

  console.log('Stores found count:', stores.length);
  if (stores.length > 0) {
    console.log('First store:', {
      id: stores[0].id,
      name: stores[0].name,
      plan: stores[0].plan,
      status: stores[0].subscription_status,
      last_payment: stores[0].subscriptionPayments
    });
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
`;

  const b64 = Buffer.from(nodeSnippet).toString('base64');
  const res = await runSSHCommand(`docker exec delivery_api node -e "$(echo '${b64}' | base64 -d)"`);
  console.log(res);
}

testSuperAdmin().catch(console.error);
