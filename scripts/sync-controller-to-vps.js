const { runSSHCommand } = require('./vps-manager');
const fs = require('fs');

async function sync() {
  const code = fs.readFileSync('backend/controllers/storeController.js', 'utf8');
  const b64 = Buffer.from(code).toString('base64');
  await runSSHCommand(`docker exec delivery_api node -e "require('fs').writeFileSync('/app/controllers/storeController.js', Buffer.from('${b64}', 'base64').toString('utf8'), 'utf8')"`);
  console.log('Successfully synced storeController.js to delivery_api!');
}

sync().catch(console.error);
