const fs = require('fs');

// 1. Patch whatsappService.js
let wsContent = fs.readFileSync('backend/services/whatsappService.js', 'utf8');
const wsTarget = '  const cleanPhone = phone.replace(/\\D/g, \'\');';
const wsRepl = `  let cleanPhone = phone.replace(/\\D/g, '');
  if (cleanPhone.startsWith('580')) {
    cleanPhone = '58' + cleanPhone.slice(3);
  } else if (cleanPhone.startsWith('0')) {
    cleanPhone = '58' + cleanPhone.replace(/^0+/, '');
  } else if (!cleanPhone.startsWith('58') && cleanPhone.length === 10) {
    cleanPhone = '58' + cleanPhone;
  }`.replace(/\n/g, '\r\n');

if (wsContent.includes(wsTarget)) {
  wsContent = wsContent.replace(wsTarget, wsRepl);
  fs.writeFileSync('backend/services/whatsappService.js', wsContent, 'utf8');
  console.log('Patched whatsappService.js with phone zero sanitization');
} else {
  console.log('wsTarget not found or already patched');
}

// 2. Patch authController.js in sendWhatsAppOtpHandler
let authContent = fs.readFileSync('backend/controllers/authController.js', 'utf8');
const authTarget = '    const cleanPhone = phone.replace(/\\D/g, \'\');';
const authRepl = `    let cleanPhone = phone.replace(/\\D/g, '');
    if (cleanPhone.startsWith('580')) {
      cleanPhone = '58' + cleanPhone.slice(3);
    } else if (cleanPhone.startsWith('0')) {
      cleanPhone = '58' + cleanPhone.replace(/^0+/, '');
    } else if (!cleanPhone.startsWith('58') && cleanPhone.length === 10) {
      cleanPhone = '58' + cleanPhone;
    }`.replace(/\n/g, '\r\n');

if (authContent.includes(authTarget)) {
  authContent = authContent.replace(authTarget, authRepl);
  fs.writeFileSync('backend/controllers/authController.js', authContent, 'utf8');
  console.log('Patched authController.js with phone zero sanitization');
} else {
  console.log('authTarget not found or already patched');
}
