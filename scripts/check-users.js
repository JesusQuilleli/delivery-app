const { runSSHCommand } = require('./vps-manager');

async function checkUsers() {
  const users = await runSSHCommand('docker exec delivery_db psql -U delivery_user -d delivery_db -c "SELECT id, username, email, role, store_id, LEFT(password, 20) as pass_prefix FROM \\"User\\";"');
  console.log('USERS IN VPS DB:\n', users);
}

checkUsers().catch(console.error);
