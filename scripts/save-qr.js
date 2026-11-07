const { runSSHCommand } = require('./vps-manager');
const fs = require('fs');
const path = require('path');

async function save() {
  const conn = await runSSHCommand('curl -s "http://127.0.0.1:8080/instance/connect/tiendafast?number=584161804831" -H "apikey: EvoApi_TiendaFast_2026_SecKey!"');
  const parsed = JSON.parse(conn);
  console.log('ACTIVE PAIRING CODE:', parsed.pairingCode);

  if (parsed.base64) {
    const b64 = parsed.base64.replace(/^data:image\/png;base64,/, '');
    const buf = Buffer.from(b64, 'base64');
    const targetPath = 'C:/Users/Jesus/.gemini/antigravity/brain/195c0a36-f297-41a8-81ce-3ed7dffaa81c/whatsapp-qr.png';
    fs.writeFileSync(targetPath, buf);
    console.log('Saved QR to:', targetPath);
  }
}

save().catch(console.error);
