async function test() {
  try {
    const loginRes = await fetch('https://vps-prueba.shop-mg.com/api/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'bambu-admin', password: 'SuperAdmin2026!' })
    });
    console.log('Login HTTP status:', loginRes.status);
    const loginData = await loginRes.json();
    console.log('Login user:', loginData);
    const cookie = loginRes.headers.get('set-cookie');

    const analyticsRes = await fetch('https://vps-prueba.shop-mg.com/api/stores/bambu/analytics', {
      headers: { Cookie: cookie }
    });
    console.log('Analytics HTTP status:', analyticsRes.status);
    const analyticsData = await analyticsRes.json();
    console.log('Analytics response:', analyticsData);
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
