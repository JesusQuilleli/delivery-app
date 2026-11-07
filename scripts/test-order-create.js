const { runSSHCommand } = require('./vps-manager');

async function testOrder() {
  const nodeSnippet = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const store = await prisma.store.findFirst();
  const user = await prisma.user.findFirst({ where: { role: 'CLIENT' } }) || await prisma.user.findFirst();
  const product = await prisma.product.findFirst({ where: { store_id: store.id } });

  console.log('Testing order creation with payment_receipt_url...');
  const order = await prisma.order.create({
    data: {
      store_id: store.id,
      user_id: user.id,
      delivery_address: 'Av. 23 de Enero, Puerto Ayacucho',
      currency: 'USD',
      usd_rate: 1.0,
      ves_rate: 36.5,
      cop_rate: 4000.0,
      subtotal: 10.0,
      delivery_fee: 2.0,
      total_amount: 12.0,
      payment_method: 'TRANSFER',
      payment_reference: '0591383838',
      payment_receipt_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      status: 'AWAITING_PAYMENT'
    }
  });

  console.log('Order created successfully! ID:', order.id, 'receipt_url:', order.payment_receipt_url);

  // Clean up test order
  await prisma.order.delete({ where: { id: order.id } });
  console.log('Test order cleaned up cleanly.');
}

run().catch(console.error).finally(() => prisma.$disconnect());
`;

  const b64 = Buffer.from(nodeSnippet).toString('base64');
  const res = await runSSHCommand(`docker exec delivery_api node -e "$(echo '${b64}' | base64 -d)"`);
  console.log(res);
}

testOrder().catch(console.error);
