const fs = require('fs');

const path = 'backend/controllers/superadminController.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Destructure adminEmail
content = content.replace(
  '      adminUsername,\r\n      adminPassword,',
  '      adminUsername,\r\n      adminEmail,\r\n      adminPassword,'
);

// 2. Add email to tx.user.create
content = content.replace(
  '          store_id: store.id,\r\n          username: adminUsername,',
  '          store_id: store.id,\r\n          username: adminUsername.trim(),\r\n          email: (adminEmail || \'\').trim().toLowerCase() || null,'
);

// 3. Update destEmail and sendStoreWelcomeEmail
const oldEmailBlock = `    const destEmail = req.body.adminEmail || (adminUsername.includes('@') ? adminUsername : null);
    if (destEmail) {
      sendStoreWelcomeEmail({
        to: destEmail,
        storeName,
        slug,
        adminEmail: destEmail,
        adminPassword,
        planTier: selectedPlan.code,
        trialDays: Number(trialDays),
        expiresAt: trialEndsAt
      }).catch(err => console.error('[EMAIL::WELCOME_ERROR]', err.message));
    }`.replace(/\n/g, '\r\n');

const newEmailBlock = `    const destEmail = (adminEmail || req.body.adminEmail || '').trim().toLowerCase() || (adminUsername.includes('@') ? adminUsername.trim().toLowerCase() : null);
    if (destEmail) {
      console.log(\`[EMAIL::ONBOARDING] Despachando credenciales de bienvenida a \${destEmail}...\`);
      sendStoreWelcomeEmail({
        to: destEmail,
        storeName,
        slug,
        adminUsername: adminUsername.trim(),
        adminEmail: destEmail,
        adminPassword,
        planTier: selectedPlan.code,
        trialDays: Number(trialDays),
        expiresAt: trialEndsAt
      }).then(res => {
        console.log(\`[EMAIL::ONBOARDING] Correo enviado exitosamente a \${destEmail}\`, res);
      }).catch(err => console.error('[EMAIL::WELCOME_ERROR]', err.message));
    } else {
      console.warn('[EMAIL::ONBOARDING] No se especificó correo para la tienda, se omite envío.');
    }`.replace(/\n/g, '\r\n');

content = content.replace(oldEmailBlock, newEmailBlock);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully patched superadminController.js');
