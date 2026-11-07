const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../frontend/src/pages/SuperAdmin.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

if (!content.includes('adminEmail')) {
  content = content.replace(
    "const [adminUsername, setAdminUsername] = useState('');",
    "const [adminUsername, setAdminUsername] = useState('');\n  const [adminEmail, setAdminEmail] = useState('');"
  );

  content = content.replace(
    "adminUsername,\n        adminPhone,",
    "adminUsername,\n        adminEmail,\n        adminPhone,"
  );

  content = content.replace(
    "setStoreName(''); setSlug(''); setAdminUsername(''); setAdminPhone(''); setAdminPassword('');",
    "setStoreName(''); setSlug(''); setAdminUsername(''); setAdminEmail(''); setAdminPhone(''); setAdminPassword('');"
  );

  const inputBlock = `                  <div className="space-y-1.5">
                    <Label className="font-bold text-gray-700 text-xs">Correo Electrónico (Para envío automático de credenciales y avisos)</Label>
                    <Input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="dueno@tienda.com (Opcional, enviará datos de acceso)" className="h-10 bg-gray-50" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-bold text-gray-700 text-xs">Usuario</Label>`;

  content = content.replace(
    `                  <div className="space-y-1.5">
                    <Label className="font-bold text-gray-700 text-xs">Usuario</Label>`,
    inputBlock
  );

  fs.writeFileSync(targetFile, content, 'utf8');
  console.log('✅ SuperAdmin.tsx patched successfully');
} else {
  console.log('SuperAdmin.tsx already patched');
}
