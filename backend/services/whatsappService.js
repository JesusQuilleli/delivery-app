const WHATSAPP_BOT_NUMBER = process.env.WHATSAPP_BOT_NUMBER || '584161804831';
// Rate limiting en memoria para envíos de WhatsApp: máximo 3 intentos por teléfono en 15 minutos
const whatsappOtpAttempts = new Map();
const MAX_ATTEMPTS = 3;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutos

/**
 * Valida si un número telefónico ha excedido el límite de solicitudes de OTP por WhatsApp.
 * @param {string} cleanPhone
 * @returns {{ allowed: boolean, remainingAttempts: number, retryAfterSeconds?: number }}
 */
function checkWhatsAppRateLimit(cleanPhone) {
  const now = Date.now();
  const record = whatsappOtpAttempts.get(cleanPhone);

  if (!record || now - record.firstAttempt > WINDOW_MS) {
    whatsappOtpAttempts.set(cleanPhone, { count: 1, firstAttempt: now, lastAttempt: now });
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - 1 };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((record.firstAttempt + WINDOW_MS - now) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSeconds };
  }

  record.count += 1;
  record.lastAttempt = now;
  return { allowed: true, remainingAttempts: MAX_ATTEMPTS - record.count };
}

/**
 * Envía un código OTP por WhatsApp usando Evolution API / Baileys con protección anti-baneo.
 * @param {string} phone Número de teléfono (ej. +584121234567 o 04121234567)
 * @param {string} otpCode Código numérico de 6 dígitos
 * @param {string} [storeName] Nombre del comercio
 * @returns {Promise<{ success: boolean, simulated?: boolean, message: string }>}
 */
async function sendWhatsAppOtp(phone, otpCode, storeName = 'TiendaFast') {
  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.startsWith('580')) {
    cleanPhone = '58' + cleanPhone.slice(3);
  } else if (cleanPhone.startsWith('0')) {
    cleanPhone = '58' + cleanPhone.replace(/^0+/, '');
  } else if (!cleanPhone.startsWith('58') && cleanPhone.length === 10) {
    cleanPhone = '58' + cleanPhone;
  }

  // 1. Validar límite de intentos
  const rateLimit = checkWhatsAppRateLimit(cleanPhone);
  if (!rateLimit.allowed) {
    const error = new Error(`Has alcanzado el límite de intentos de WhatsApp. Intenta de nuevo en ${Math.ceil(rateLimit.retryAfterSeconds / 60)} minutos.`);
    error.status = 429;
    throw error;
  }

  // 2. Variantes de mensaje (Spintax anti-baneo: evita mensajes repetitivos idénticos)
  const variants = [
    `🔐 Tu código de acceso para *${storeName}* es: *${otpCode}*.\n\nVálido por 10 minutos. No compartas este código con nadie.`,
    `⚡ ¡Hola! Ingresa el código *${otpCode}* para verificar tu pedido en *${storeName}*.\n\nExpira en 10 minutos.`,
    `📦 Verificación de seguridad TiendaFast: Tu código es *${otpCode}* para tu orden en *${storeName}*.\n\nSi no solicitaste este código, ignora este mensaje.`,
    `👋 Hola! Usa el código *${otpCode}* para continuar tu compra en *${storeName}*.\n\nCódigo de uso único válido por 10 min.`
  ];
  const selectedText = variants[Math.floor(Math.random() * variants.length)];

  // 3. Si Evolution API está configurado en el entorno (VPS / Docker), despacha la solicitud
  const evolutionUrl = process.env.EVOLUTION_API_URL;
  const evolutionKey = process.env.EVOLUTION_API_KEY || '';
  const instanceName = process.env.EVOLUTION_INSTANCE || 'tiendafast';

  if (evolutionUrl && typeof fetch === 'function') {
    try {
      const response = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionKey
        },
        body: JSON.stringify({
          number: cleanPhone,
          text: selectedText,
          options: {
            delay: 1500, // Simulación de digitación humana (1.5 segundos)
            presence: 'composing'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Evolution API HTTP ${response.status}`);
      }

      console.log(`[WHATSAPP_OTP] Despachado vía Evolution API a ${cleanPhone}`);
      return { success: true, simulated: false, bot_number: WHATSAPP_BOT_NUMBER, message: 'Código enviado por WhatsApp' };
    } catch (err) {
      console.error('[WHATSAPP_OTP] Error despachando por Evolution API:', err.message);
      // Fallback a simulación para no bloquear la compra si la API externa falla
    }
  }

  // 4. Modo Simulado / Entorno Local / Contingencia
  console.log(`[WHATSAPP_OTP_LOCAL] Código para ${cleanPhone} (${storeName}): ${otpCode}`);
  return {
    success: true,
    simulated: true,
    bot_number: WHATSAPP_BOT_NUMBER,
    code: otpCode,
    message: 'Código generado (simulado en entorno local / WhatsApp log)'
  };
}

module.exports = {
  WHATSAPP_BOT_NUMBER,
  sendWhatsAppOtp,
  checkWhatsAppRateLimit
};
