const { runSSHCommand } = require('./vps-manager');

async function checkCols() {
  const cols = await runSSHCommand('docker exec delivery_db psql -U delivery_user -d delivery_db -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'Order\';"');
  console.log('ORDER COLS:\n', cols);
}

checkCols().catch(console.error);
