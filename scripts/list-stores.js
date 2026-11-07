const { runSSHCommand } = require('./vps-manager');

async function main() {
  const users = await runSSHCommand('docker exec delivery_db psql -U delivery_user -d delivery_db -c "SELECT id, email, role, store_id FROM \\"User\\";"');
  console.log('USERS:\n', users);
}

main().catch(console.error);
