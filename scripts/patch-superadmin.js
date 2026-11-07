const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../backend/controllers/superadminController.js');
let content = fs.readFileSync(targetFile, 'utf8');

if (!content.includes('sendStoreWelcomeEmail')) {
  content = content.replace(
    "const { getPlan, PLANS } = require('../config/plans');",
    "const { getPlan, PLANS } = require('../config/plans');\nconst { sendStoreWelcomeEmail } = require('../services/emailService');"
  );

  const targetLine = "res.json({ message: 'Tienda y catálogo inicial creados exitosamente', data: result });";
  const addedLogic = `const destEmail = req.body.adminEmail || (adminUsername.includes('@') ? adminUsername : null);
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
    }

    res.json({ message: 'Tienda y catálogo inicial creados exitosamente', data: result });`;

  content = content.replace(targetLine, addedLogic);
  fs.writeFileSync(targetFile, content, 'utf8');
  console.log('✅ superadminController.js patched successfully');
} else {
  console.log('Already patched');
}
