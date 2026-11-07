const { runSSHCommand } = require('./vps-manager');

async function main() {
  const code = `
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.category.findMany({
  include: { store: { select: { slug: true } }, _count: { select: { products: true } } }
}).then(cats => {
  console.log('CATEGORIES:', JSON.stringify(cats, null, 2));
  process.exit(0);
});
`.trim();
  const b64 = Buffer.from(code).toString('base64');
  const res = await runSSHCommand(`docker exec delivery_api node -e "eval(Buffer.from('${b64}', 'base64').toString('utf8'))"`);
  console.log(res);
}

main().catch(console.error);
