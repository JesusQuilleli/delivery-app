const { runSSHCommand } = require('./vps-manager');

async function main() {
  const code = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const storeController = require('./controllers/storeController');

const req = {
  params: { slug: 'bambu' },
  query: {}
};
const res = {
  json: (data) => console.log('SUCCESS:', data),
  status: (code) => {
    console.log('STATUS:', code);
    return {
      json: (err) => console.log('ERROR RESPONSE:', err)
    };
  }
};

storeController.getStoreAnalytics(req, res).then(() => {
  console.log('Finished getStoreAnalytics call');
  process.exit(0);
}).catch(err => {
  console.error('PROMISE REJECTED:', err);
  process.exit(1);
});
`.trim();

  const b64 = Buffer.from(code).toString('base64');
  const result = await runSSHCommand(`docker exec delivery_api node -e "eval(Buffer.from('${b64}', 'base64').toString('utf8'))"`);
  console.log(result);
}

main().catch(console.error);
