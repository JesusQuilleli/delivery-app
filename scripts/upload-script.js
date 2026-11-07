const { runSSHCommand } = require('./vps-manager');
const fs = require('fs');
const path = require('path');

async function upload() {
  const localPath = path.resolve(__dirname, 'whatsapp-pair.sh');
  const content = fs.readFileSync(localPath, 'utf8').replace(/\r\n/g, '\n');
  const b64 = Buffer.from(content).toString('base64');

  console.log('Subiendo whatsapp-pair.sh a VPS...');
  await runSSHCommand(`echo "${b64}" | base64 -d > /opt/delivery-app/scripts/whatsapp-pair.sh && chmod +x /opt/delivery-app/scripts/whatsapp-pair.sh`);
  console.log('✅ Archivo subido y permisos asignados.');

  console.log('\nEjecutando script de vinculación en VPS...');
  const out = await runSSHCommand('bash /opt/delivery-app/scripts/whatsapp-pair.sh');
  console.log(out);
}

upload().catch(console.error);
