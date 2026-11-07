const { runSSHCommand } = require('./vps-manager');
const fs = require('fs');

async function main() {
  console.log('1. Eliminando instancia vieja...');
  await runSSHCommand('curl -s -X DELETE http://127.0.0.1:8080/instance/delete/tiendafast -H "apikey: EvoApi_TiendaFast_2026_SecKey!" || true');

  console.log('2. Limpiando Redis...');
  await runSSHCommand('docker exec delivery_redis redis-cli flushall');

  console.log('3. Creando instancia con número 584161804831...');
  const createRes = await runSSHCommand('curl -s -X POST http://127.0.0.1:8080/instance/create -H "Content-Type: application/json" -H "apikey: EvoApi_TiendaFast_2026_SecKey!" -d "{\\"instanceName\\": \\"tiendafast\\", \\"token\\": \\"EvoApi_TiendaFast_2026_SecKey!\\", \\"number\\": \\"584161804831\\", \\"qrcode\\": true, \\"integration\\": \\"WHATSAPP-BAILEYS\\"}"');
  console.log('CREATE RES:', createRes);

  console.log('4. Esperando 3 segundos...');
  await new Promise(r => setTimeout(r, 3000));

  console.log('5. Obteniendo credenciales de conexión...');
  const connRes = await runSSHCommand('curl -s http://127.0.0.1:8080/instance/connect/tiendafast -H "apikey: EvoApi_TiendaFast_2026_SecKey!"');
  const json = JSON.parse(connRes);

  console.log('\n======================================================');
  console.log('🔑 CÓDIGO DE VINCULACIÓN (PAIRING CODE):', json.pairingCode);
  console.log('======================================================\n');

  if (json.base64) {
    const b64 = json.base64.replace(/^data:image\/png;base64,/, '');
    const buf = Buffer.from(b64, 'base64');
    const targetPath = 'C:/Users/Jesus/.gemini/antigravity/brain/195c0a36-f297-41a8-81ce-3ed7dffaa81c/whatsapp-qr.png';
    fs.writeFileSync(targetPath, buf);
    console.log('✅ QR Code actualizado en:', targetPath);
  }

  const logs = await runSSHCommand('docker logs --tail 25 delivery_evolution_api 2>&1');
  const cleanLogs = logs.split('\n').filter(l => !l.includes('█') && !l.includes('▄') && !l.includes('▀')).join('\n');
  console.log(cleanLogs);
}

main().catch(console.error);
