const { runSSHCommand } = require('./vps-manager');

async function testHttpSubscriptions() {
  const nodeSnippet = `
const http = require('http');

function post(path, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        data: JSON.parse(body)
      }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function get(path, cookie) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'GET',
      headers: {
        'Cookie': cookie
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  const loginRes = await post('/api/auth/admin-login', {
    username: 'jqcelis092@gmail.com',
    password: 'SuperAdmin2026!'
  });
  console.log('Login status:', loginRes.status);
  const setCookie = loginRes.headers['set-cookie'];
  console.log('Set-Cookie:', setCookie);

  const cookieHeader = Array.isArray(setCookie) ? setCookie.map(c => c.split(';')[0]).join('; ') : '';

  const subRes = await get('/api/superadmin/subscriptions', cookieHeader);
  console.log('Subscriptions API status:', subRes.status);
  console.log('Summary:', subRes.data.summary);
  console.log('Stores count:', subRes.data.stores?.length);
  if (subRes.data.stores?.length > 0) {
    console.log('Store 1:', subRes.data.stores[0].name, '| Plan:', subRes.data.stores[0].plan, '| Status:', subRes.data.stores[0].subscription_status);
  }
}

run().catch(console.error);
`;

  const b64 = Buffer.from(nodeSnippet).toString('base64');
  const res = await runSSHCommand(`docker exec delivery_api node -e "$(echo '${b64}' | base64 -d)"`);
  console.log(res);
}

testHttpSubscriptions().catch(console.error);
