const { runSSHCommand } = require('./vps-manager');

async function main() {
  const code = `
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function run() {
  const cats = await p.category.findMany({
    orderBy: { id: 'asc' }
  });
  const seen = new Map();
  for (const c of cats) {
    const key = c.store_id + ':' + c.name.trim().toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, c.id);
    } else {
      console.log('Deleting duplicate category id:', c.id, 'name:', c.name, 'store_id:', c.store_id);
      // Reassign any products to first category before deleting
      await p.product.updateMany({
        where: { category_id: c.id },
        data: { category_id: seen.get(key) }
      });
      await p.category.delete({ where: { id: c.id } });
    }
  }
  console.log('Deduplication done!');
  process.exit(0);
}
run();
`.trim();
  const b64 = Buffer.from(code).toString('base64');
  const res = await runSSHCommand(`docker exec delivery_api node -e "eval(Buffer.from('${b64}', 'base64').toString('utf8'))"`);
  console.log(res);
}

main().catch(console.error);
