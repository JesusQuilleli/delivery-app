const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { sendWhatsAppOtp, checkWhatsAppRateLimit } = require('../services/whatsappService');

describe('WhatsApp Service (Unit)', () => {
  it('permite enviar OTP en modo local/simulado', async () => {
    const res = await sendWhatsAppOtp('04121234567', '491028', 'Farma-Ayacucho');
    assert.equal(res.success, true);
    assert.equal(res.simulated, true);
    assert.equal(res.code, '491028');
  });

  it('aplica rate limit tras superar el máximo de intentos', () => {
    const testPhone = '584149999999';
    // Primer intento
    const r1 = checkWhatsAppRateLimit(testPhone);
    assert.equal(r1.allowed, true);

    // Segundo intento
    const r2 = checkWhatsAppRateLimit(testPhone);
    assert.equal(r2.allowed, true);

    // Tercer intento
    const r3 = checkWhatsAppRateLimit(testPhone);
    assert.equal(r3.allowed, true);

    // Cuarto intento: bloqueado
    const r4 = checkWhatsAppRateLimit(testPhone);
    assert.equal(r4.allowed, false);
    assert.ok(r4.retryAfterSeconds > 0);
  });
});
