const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../frontend/src/pages/OrderHistory.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const isCrlf = content.includes('\r\n');
let normalized = content.replace(/\r\n/g, '\n');

const target = `  useEffect(() => {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      navigate('/admin-login');
      return;
    }

    fetchHistory();
    fetchAnalytics();
    api.get(\`/stores/\${slug}/products?limit=1\`).then(res => {
      if (res.data.store) setStoreConfig(res.data.store);
    }).catch(e => console.error(e));
  }, [slug, navigate, user]);`;

const replace = `  useEffect(() => {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      navigate('/admin-login');
      return;
    }

    fetchHistory();
    fetchAnalytics();
    api.get(\`/stores/\${slug}/products?limit=1\`).then(res => {
      if (res.data.store) setStoreConfig(res.data.store);
    }).catch(e => console.error(e));
  }, [slug, user?.id]);`;

if (!normalized.includes(target)) {
  console.error('Target not found in OrderHistory.tsx!');
  process.exit(1);
}

normalized = normalized.replace(target, replace);
const finalContent = isCrlf ? normalized.replace(/\n/g, '\r\n') : normalized;
fs.writeFileSync(filePath, finalContent, 'utf8');
console.log('Successfully updated frontend/src/pages/OrderHistory.tsx!');
