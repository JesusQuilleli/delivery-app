const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend', 'src', 'components', 'AdminLayout.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Import NotificationPermissionBanner and NotificationStatusButton
if (!code.includes('NotificationPermissionBanner')) {
  code = code.replace(
    "import { Button } from './ui/button';",
    "import { Button } from './ui/button';\nimport { NotificationPermissionBanner, NotificationStatusButton } from './NotificationPermissionBanner';"
  );
}

// 2. Add NotificationStatusButton in the header
if (!code.includes('<NotificationStatusButton />')) {
  code = code.replace(
    `<Button variant="destructive" onClick={handleLogout}`,
    `<NotificationStatusButton />\n          <Button variant="destructive" onClick={handleLogout}`
  );
}

// 3. Add NotificationPermissionBanner right under header
if (!code.includes('<NotificationPermissionBanner role="admin"')) {
  code = code.replace(
    `</header>`,
    `</header>\n\n      {/* Alerta interactiva de Notificaciones para el Administrador */}\n      <NotificationPermissionBanner role="admin" className="mb-4 print:hidden" />`
  );
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully patched AdminLayout.tsx!');
