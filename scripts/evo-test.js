const { runSSHCommand } = require('./vps-manager');

async function test() {
  const conn = await runSSHCommand('curl -s "http://127.0.0.1:8080/instance/connect/tiendafast?number=584161804831" -H "apikey: EvoApi_TiendaFast_2026_SecKey!"');
  const parsed = JSON.parse(conn);
  console.log('PAIRING CODE:', parsed.pairingCode);

  if (parsed.code) {
    const qrTerminalCmd = `docker exec delivery_evolution_api node -e "require('qrcode-terminal').generate('${parsed.code}', {small: true})"`;
    const asciiQr = await runSSHCommand(qrTerminalCmd);
    console.log('ASCII QR OUTPUT:\n', asciiQr);
  }
}

test().catch(console.error);
