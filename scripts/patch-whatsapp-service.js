const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../backend/services/whatsappService.js');

const content = `const WHATSAPP_BOT_NUMBER = process.env.WHATSAPP_BOT_NUMBER || '584161804831';
// Rate limiting en memoria para envíos de OTP: máximo 3 intentos por teléfono en 15 minutos
const whatsappOtpAttempts = new Map();
const MAX_ATTEMPTS = 3;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutos

/**
 * Normaliza cualquier número telefónico al formato internacional limpio E.164 (Venezuela 58...).
 */
function cleanPhoneNumber(phone) {
  if (!phone) return '';
  let clean = String(phone).replace(/\\D/g, '');
  if (clean.startsWith('580')) {
    clean = '58' + clean.slice(3);
  } else if (clean.startsWith('0')) {
    clean = '58' + clean.replace(/^0+/, '');
  } else if (!clean.startsWith('58') && clean.length === 10) {
    clean = '58' + clean;
  }
  return clean;
}

/**
 * Valida si un número telefónico ha excedido el límite de solicitudes de OTP por WhatsApp.
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
 * Envío genérico de WhatsApp mediante Evolution API con presencia 'composing' y retardo humano anti-baneo.
 */
async function sendRawWhatsApp(phone, text) {
  const cleanPhone = cleanPhoneNumber(phone);
  if (!cleanPhone || cleanPhone.length < 10) {
    console.warn('[WHATSAPP] Teléfono inválido para envío:', phone);
    return { success: false, error: 'Teléfono inválido' };
  }

  const evolutionUrl = process.env.EVOLUTION_API_URL;
  const evolutionKey = process.env.EVOLUTION_API_KEY || '';
  const instanceName = process.env.EVOLUTION_INSTANCE || 'tiendafast';

  if (evolutionUrl && typeof fetch === 'function') {
    try {
      const response = await fetch(\`\${evolutionUrl}/message/sendText/\${instanceName}\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionKey
        },
        body: JSON.stringify({
          number: cleanPhone,
          text,
          options: {
            delay: Math.floor(Math.random() * 1000) + 1200, // 1.2s a 2.2s de digitación
            presence: 'composing'
          }
        })
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        throw new Error(\`Evolution API HTTP \${response.status}: \${errorBody}\`);
      }

      console.log(\`[WHATSAPP_DISPATCH] Mensaje entregado a \${cleanPhone}\`);
      return { success: true, simulated: false };
    } catch (err) {
      console.error('[WHATSAPP_DISPATCH] Error enviando por Evolution API:', err.message);
      return { success: false, error: err.message };
    }
  }

  console.log(\`[WHATSAPP_DISPATCH_LOCAL] Para \${cleanPhone}:\\n\${text}\`);
  return { success: true, simulated: true };
}

/**
 * Envía un código OTP por WhatsApp usando Evolution API con protección anti-baneo (Spintax y rate limit).
 */
async function sendWhatsAppOtp(phone, otpCode, storeName = 'TiendaFast') {
  const cleanPhone = cleanPhoneNumber(phone);

  // 1. Validar límite de intentos
  const rateLimit = checkWhatsAppRateLimit(cleanPhone);
  if (!rateLimit.allowed) {
    const error = new Error(\`Has alcanzado el límite de intentos de WhatsApp. Intenta de nuevo en \${Math.ceil(rateLimit.retryAfterSeconds / 60)} minutos.\`);
    error.status = 429;
    throw error;
  }

  // 2. Variantes de mensaje (Spintax anti-baneo)
  const variants = [
    \`🔐 Tu código de acceso para *\${storeName}* es: *\${otpCode}*.\\n\\nVálido por 10 minutos. No compartas este código con nadie.\`,
    \`⚡ ¡Hola! Ingresa el código *\${otpCode}* para verificar tu pedido en *\${storeName}*.\\n\\nExpira en 10 minutos.\`,
    \`📦 Verificación de seguridad TiendaFast: Tu código es *\${otpCode}* para tu orden en *\${storeName}*.\\n\\nSi no solicitaste este código, ignora este mensaje.\`,
    \`👋 Hola! Usa el código *\${otpCode}* para continuar tu compra en *\${storeName}*.\\n\\nCódigo de uso único válido por 10 min.\`
  ];
  const selectedText = variants[Math.floor(Math.random() * variants.length)];

  const res = await sendRawWhatsApp(cleanPhone, selectedText);
  return {
    success: true,
    simulated: res.simulated || false,
    bot_number: WHATSAPP_BOT_NUMBER,
    message: 'Código enviado por WhatsApp'
  };
}

/**
 * Notificación automática por WhatsApp al CLIENTE cuando su pedido es despachado ("En Camino").
 */
async function sendOrderDispatchedToCustomer(order, store) {
  if (!order.user?.phone) return;
  const storeName = store?.name || 'Tu tienda';
  const customerName = order.user.name || 'Cliente';
  const driverName = order.driver?.name || 'Repartidor asignado';
  const driverPhone = order.driver?.phone ? \` (📞 \${order.driver.phone})\` : '';

  const cleanAddress = (order.delivery_address || '').split(' | Link GMaps:')[0];
  const totalStr = \`\${Number(order.total_amount).toFixed(2)} \${store?.currency || 'USD'}\`;
  const paymentMethodStr = order.payment_method === 'CASH' ? 'Efectivo al recibir' : 'Pago Móvil (Ya validado)';

  const variants = [
    \`🛵💨 *¡Tu pedido va en camino!*
¡Hola \${customerName}! Tu pedido *#\${order.id}* de *\${storeName}* ya fue despachado.

📍 *Dirección de entrega:* \${cleanAddress}
🛵 *Repartidor:* \${driverName}\${driverPhone}
💵 *Total:* \${totalStr} (\${paymentMethodStr})

¡En breve estará en tu puerta! Gracias por ordenar en *\${storeName}*.\`,

    \`🛵 *¡Pedido en ruta hacia tu dirección!*
Buenas noticias, \${customerName}: Tu orden *#\${order.id}* de *\${storeName}* ya está con el motorizado.

📍 *Destino:* \${cleanAddress}
🛵 *Motorizado:* \${driverName}\${driverPhone}
💰 *Monto:* \${totalStr} (\${paymentMethodStr})

¡En unos minutos llegará a tu ubicación!\`,

    \`⚡ *Tu entrega #\${order.id} ha salido de \${storeName}.*
Hola \${customerName}, tu pedido va rumbo a:
📍 \${cleanAddress}

🛵 Repartidor: *\${driverName}*\${driverPhone}
💵 Monto / Método: *\${totalStr}* (\${paymentMethodStr})

¡Pronto tocará a tu puerta! Gracias por tu preferencia.\`
  ];

  const text = variants[Math.floor(Math.random() * variants.length)];
  return sendRawWhatsApp(order.user.phone, text);
}

/**
 * Notificación automática por WhatsApp al MOTORIZADO cuando se le asigna un pedido a despachar.
 */
async function sendOrderDispatchedToDriver(order, store, driver) {
  if (!driver?.phone) return;
  const storeName = store?.name || 'Tu tienda';
  const customerName = order.user?.name || 'Cliente';
  const customerPhone = order.user?.phone || 'No registrado';
  const cleanAddress = (order.delivery_address || '').split(' | Link GMaps:')[0];
  const addressDetails = order.address_details ? \`\\n📝 *Referencia:* \${order.address_details}\` : '';
  const totalStr = \`\${Number(order.total_amount).toFixed(2)} \${store?.currency || 'USD'}\`;
  const paymentAction = order.payment_method === 'CASH'
    ? \`⚠️ *COBRAR EN EFECTIVO AL CLIENTE:* \${totalStr}\`
    : \`✅ *PAGO MÓVIL YA CONFIRMADO* (No cobrar nada al cliente)\`;

  const itemsText = (order.items || [])
    .map(i => \`  • \${i.quantity}x \${i.product?.name || 'Producto'}\`)
    .join('\\n');

  let mapLink = '';
  if (order.latitude && order.longitude) {
    mapLink = \`\\n\\n🗺️ *Navegación Google Maps:*\\nhttps://www.google.com/maps/search/?api=1&query=\${order.latitude},\${order.longitude}\`;
  } else if (order.delivery_address && order.delivery_address.includes('Link GMaps: http')) {
    mapLink = \`\\n\\n🗺️ *Ubicación del cliente:*\\n\${order.delivery_address.split('Link GMaps: ')[1]}\`;
  }

  const message = \`📦 *NUEVA ENTREGA ASIGNADA — Pedido #\${order.id}*
🏪 *Tienda:* \${storeName}

👤 *Cliente:* \${customerName}
📞 *Teléfono:* \${customerPhone}
📍 *Dirección:* \${cleanAddress}\${addressDetails}

📋 *Productos a entregar:*
\${itemsText || '  • Ver comanda en tienda'}

💵 *Cobro:*
\${paymentAction}\${mapLink}

⚡ *Por favor reporta a la tienda cuando hayas entregado el pedido.*\`;

  return sendRawWhatsApp(driver.phone, message);
}

module.exports = {
  WHATSAPP_BOT_NUMBER,
  cleanPhoneNumber,
  checkWhatsAppRateLimit,
  sendRawWhatsApp,
  sendWhatsAppOtp,
  sendOrderDispatchedToCustomer,
  sendOrderDispatchedToDriver
};
`;

fs.writeFileSync(filePath, content.replace(/\n/g, '\r\n'), 'utf8');
console.log('Successfully updated backend/services/whatsappService.js!');
