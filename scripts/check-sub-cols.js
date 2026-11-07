const { runSSHCommand } = require('./vps-manager');

async function fixSubCols() {
  const alterSql = 'ALTER TABLE "SubscriptionPayment" ADD COLUMN IF NOT EXISTS payment_receipt_url text;';
  const b64 = Buffer.from(alterSql).toString('base64');
  console.log('Running ALTER TABLE...');
  await runSSHCommand(`docker exec delivery_db psql -U delivery_user -d delivery_db -c "$(echo '${b64}' | base64 -d)"`);

  const checkSql = "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'SubscriptionPayment';";
  const b64Check = Buffer.from(checkSql).toString('base64');
  const res = await runSSHCommand(`docker exec delivery_db psql -U delivery_user -d delivery_db -c "$(echo '${b64Check}' | base64 -d)"`);
  console.log('Updated columns:\n', res);
}

fixSubCols().catch(console.error);

