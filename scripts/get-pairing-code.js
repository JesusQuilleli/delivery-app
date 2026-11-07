const { runSSHCommand } = require('./vps-manager');
const fs = require('fs');

async function main() {
  const connState = await runSSHCommand('curl -s http://127.0.0.1:8080/instance/connectionState/tiendafast -H "apikey: EvoApi_TiendaFast_2026_SecKey!"');
  console.log('CONN STATE:', connState);

  const connectRes = await runSSHCommand('curl -s http://127.0.0.1:8080/instance/connect/tiendafast -H "apikey: EvoApi_TiendaFast_2026_SecKey!"');
  const json = JSON.parse(connectRes);

  console.log('PAIRING CODE:', json.pairingCode);
  console.log('COUNT:', json.count);

  if (json.base64) {
    const b64 = json.base64.replace(/^data:image\/png;base64,/, '');
    const buf = Buffer.from(b64, 'base64');
    const targetPath = 'C:/Users/Jesus/.gemini/antigravity/brain/195c0a36-f297-41a8-81ce-3ed7dffaa81c/whatsapp-qr.png';
    fs.writeFileSync(targetPath, buf);
    console.log('✅ QR Code guardado en:', targetPath);
  }
}

main().catch(console.error);
