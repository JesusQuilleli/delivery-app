const { runSSHCommand } = require('./vps-manager');

async function main() {
  console.log('--- 1. Puertos abiertos al exterior (ss -tulpn) ---');
  const ports = await runSSHCommand('ss -tulpn');
  console.log(ports);

  console.log('--- 2. Estado del Firewall (UFW) e IPTables ---');
  const ufw = await runSSHCommand('which ufw && ufw status || echo "No UFW"');
  console.log(ufw);

  console.log('--- 3. Verificando fail2ban ---');
  const f2b = await runSSHCommand('which fail2ban-client && systemctl status fail2ban || echo "No fail2ban"');
  console.log(f2b);

  console.log('--- 4. Comprobando paquetes de seguridad de Ubuntu ---');
  const aptCheck = await runSSHCommand('apt-get update -q && apt-get --just-print upgrade | grep -E "Inst|upgraded" | wc -l');
  console.log('Paquetes pendientes de actualización:', aptCheck.trim());
}

main().catch(console.error);
