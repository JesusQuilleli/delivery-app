const { runSSHCommand } = require('./vps-manager');

async function deploy() {
  console.log('🚀 1. Git pull en VPS...');
  await runSSHCommand('cd /opt/delivery-app && git pull origin main');

  console.log('📦 2. Sincronizando schema y controladores en delivery_api...');
  await runSSHCommand('docker cp /opt/delivery-app/backend/prisma/schema.prisma delivery_api:/app/prisma/schema.prisma');
  await runSSHCommand('docker exec delivery_api npx prisma generate');
  await runSSHCommand('docker cp /opt/delivery-app/backend/controllers/authController.js delivery_api:/app/controllers/authController.js');
  await runSSHCommand('docker cp /opt/delivery-app/backend/controllers/orderController.js delivery_api:/app/controllers/orderController.js');
  await runSSHCommand('docker cp /opt/delivery-app/backend/services/whatsappService.js delivery_api:/app/services/whatsappService.js');
  
  console.log('🔄 3. Reiniciando delivery_api...');
  await runSSHCommand('docker restart delivery_api');

  console.log('🌐 4. Reconstruyendo frontend delivery_web...');
  await runSSHCommand('cd /opt/delivery-app && docker compose -f docker-compose.prod.yml build web && docker compose -f docker-compose.prod.yml up -d web');

  console.log('✅ Despliegue completado con éxito!');
}

deploy().catch(err => {
  console.error('❌ Error en despliegue:', err);
  process.exit(1);
});
