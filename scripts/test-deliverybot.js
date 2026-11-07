const { runSSHCommand } = require('./vps-manager');

async function main() {
  console.log('1. Reiniciando servicio de docker para restaurar chains de iptables...');
  await runSSHCommand('systemctl restart docker');

  console.log('2. Esperando 5 segundos...');
  await new Promise(r => setTimeout(r, 5000));

  console.log('3. Levantando el stack completo con docker compose...');
  await runSSHCommand('cd /opt/delivery-app && docker compose -f docker-compose.prod.yml up -d');

  console.log('4. Esperando 12 segundos...');
  await new Promise(r => setTimeout(r, 12000));

  console.log('5. Verificando estado de contenedores...');
  const ps = await runSSHCommand('docker ps');
  console.log('DOCKER PS:\n', ps);
}

main().catch(console.error);
