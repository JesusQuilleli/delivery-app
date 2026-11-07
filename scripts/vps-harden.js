const { runSSHCommand } = require('./vps-manager');

async function main() {
  console.log('1. Verificando paquetes en hold para proteger docker...');
  const hold = await runSSHCommand('apt-mark showhold');
  console.log('HOLD PACKAGES:', hold.trim());

  console.log('2. Habilitando y arrancando fail2ban contra ataques de fuerza bruta SSH...');
  await runSSHCommand('systemctl enable fail2ban && systemctl restart fail2ban');
  const f2bStatus = await runSSHCommand('fail2ban-client status sshd || fail2ban-client status');
  console.log('FAIL2BAN STATUS:\n', f2bStatus);

  console.log('3. Ejecutando actualización de paquetes de seguridad del sistema...');
  await runSSHCommand('DEBIAN_FRONTEND=noninteractive apt-get upgrade -y --with-new-pkgs');
  console.log('✅ Actualizaciones del sistema completadas.');
}

main().catch(console.error);
