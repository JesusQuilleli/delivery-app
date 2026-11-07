const { runSSHCommand } = require('./vps-manager');
const fs = require('fs');
const path = require('path');

const filesToUpload = [
  {
    local: path.resolve(__dirname, '../backend/services/emailService.js'),
    remote: '/opt/delivery-app/backend/services/emailService.js'
  },
  {
    local: path.resolve(__dirname, '../backend/services/subscriptionService.js'),
    remote: '/opt/delivery-app/backend/services/subscriptionService.js'
  },
  {
    local: path.resolve(__dirname, '../backend/controllers/superadminController.js'),
    remote: '/opt/delivery-app/backend/controllers/superadminController.js'
  }
];

async function deploy() {
  console.log('1. Subiendo archivos actualizados a VPS...');
  for (const f of filesToUpload) {
    const content = fs.readFileSync(f.local, 'utf8').replace(/\r\n/g, '\n');
    const b64 = Buffer.from(content).toString('base64');
    console.log(`Subiendo -> ${f.remote}...`);
    await runSSHCommand(`echo "${b64}" | base64 -d > ${f.remote}`);
  }

  console.log('\n2. Reiniciando contenedor delivery_api...');
  await runSSHCommand('docker restart delivery_api');

  console.log('\n3. Esperando 5 segundos...');
  await new Promise(r => setTimeout(r, 5000));

  console.log('\n4. Verificando logs de delivery_api...');
  const logs = await runSSHCommand('docker logs delivery_api --tail 25');
  console.log('LOGS API:\n', logs);
}

deploy().catch(console.error);
