const { runSSHCommand } = require('./vps-manager');

async function testLogins() {
  const nodeSnippet = `
const http = require('http');

function check(u, p, label) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ username: u, password: p });
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/admin-login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({ label, status: res.statusCode, body: body.slice(0, 100) });
      });
    });
    req.on('error', (e) => resolve({ label, error: e.message }));
    req.write(data);
    req.end();
  });
}

async function main() {
  const r1 = await check('jqcelis092@gmail.com', 'SuperAdmin2026!', 'SuperAdmin by Email');
  const r2 = await check('jqcelis092', 'SuperAdmin2026!', 'SuperAdmin by Username');
  const r3 = await check('admin@demo.com', 'Admin123!', 'Admin by Email');
  const r4 = await check('admin_demo', 'Admin123!', 'Admin by Username');
  console.log(JSON.stringify([r1, r2, r3, r4], null, 2));
}

main();
`;

  const b64 = Buffer.from(nodeSnippet).toString('base64');
  const cmd = `docker exec delivery_api node -e "$(echo '${b64}' | base64 -d)"`;
  const result = await runSSHCommand(cmd);
  console.log('Result:\n', result);
}

testLogins().catch(console.error);

