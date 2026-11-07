const { Resend } = require('resend');
const nodemailer = require('nodemailer');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || 'TiendaFast <no-reply@shop-mg.com>';
const BASE_URL = process.env.BASE_URL || 'https://vps-prueba.shop-mg.com';

/**
 * Helper genérico de despacho de email con fallback inteligente.
 */
async function sendEmail({ to, subject, html, text }) {
  if (!to) {
    console.warn('[EMAIL] Destinatario vacío, se omite envío.');
    return { skipped: true };
  }

  // 1. Prioridad: Resend API si la key está configurada
  if (RESEND_API_KEY) {
    try {
      const resend = new Resend(RESEND_API_KEY);
      const { data, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject,
        html,
        text
      });
      if (error) {
        console.error('[EMAIL::RESEND] Error:', error);
      } else {
        console.log(`✉️ [EMAIL::RESEND] Enviado con éxito a ${to}. ID: ${data?.id}`);
        return { success: true, provider: 'resend', id: data?.id };
      }
    } catch (err) {
      console.error('[EMAIL::RESEND] Excepción:', err.message);
    }
  }

  // 2. Alternativa: Nodemailer SMTP estándar si las credenciales existen
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: Number(SMTP_PORT) === 465,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS
        }
      });
      const info = await transporter.sendMail({
        from: EMAIL_FROM,
        to,
        subject,
        html,
        text
      });
      console.log(`✉️ [EMAIL::SMTP] Enviado con éxito a ${to}. Mensaje ID: ${info.messageId}`);
      return { success: true, provider: 'smtp', messageId: info.messageId };
    } catch (err) {
      console.error('[EMAIL::SMTP] Excepción:', err.message);
    }
  }

  // 3. Fallback simulado para entorno local / desarrollo sin credenciales
  console.log(`✉️ [EMAIL::SIMULATOR] (Sin credenciales SMTP/Resend) Simulación de envío a ${to}: "${subject}"`);
  return { simulated: true, to, subject };
}

/**
 * 👑 Flujo 1: Correo de Bienvenida y Onboarding para Nueva Tienda Suscrita
 */
async function sendStoreWelcomeEmail({
  to,
  storeName,
  slug,
  adminUsername,
  adminEmail,
  adminPassword,
  planTier = 'EMPRENDEDOR',
  trialDays = 30,
  expiresAt,
  publicUrl,
  adminUrl
}) {
  const storeUrl = publicUrl || `${BASE_URL}/${slug}`;
  const loginUrl = adminUrl || `${BASE_URL}/admin-login`;

  const planNames = {
    EMPRENDEDOR: 'Plan Emprendedor ($9/mes)',
    NEGOCIO: 'Plan Negocio ($19/mes)',
    PRO: 'Plan Pro / Cadena ($35/mes)'
  };
  const planDisplay = planNames[planTier] || planTier;

  const planFeatures = {
    EMPRENDEDOR: [
      'Hasta 50 productos en catálogo digital',
      'Recepción de pedidos en tiempo real con alertas sonoras',
      'Cálculo de delivery geolocalizado en Puerto Ayacucho',
      'Panel de control para 1 Administrador'
    ],
    NEGOCIO: [
      'Hasta 250 productos y combos ilimitados',
      'Múltiples zonas de reparto y tarifas personalizadas',
      'Historial de ventas y reportes exportables a CSV',
      'Acceso para hasta 3 Administradores'
    ],
    PRO: [
      'Catálogo amplio hasta 1000 productos',
      'Control multi-sucursal y motorizados ilimitados',
      'Reportes avanzados de ventas y clientes recurrentes',
      'Soporte prioritario y hasta 10 Administradores'
    ]
  };

  const featuresList = (planFeatures[planTier] || planFeatures.EMPRENDEDOR)
    .map(f => `<li style="margin-bottom: 6px;">✅ ${f}</li>`)
    .join('');

  const expiryText = expiresAt
    ? new Date(expiresAt).toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric' })
    : `${trialDays} días a partir de hoy`;

  const subject = `🎉 ¡Bienvenido a TiendaFast! Tus accesos para ${storeName}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 26px; font-weight: 800; }
        .header p { margin: 8px 0 0; opacity: 0.95; font-size: 15px; }
        .content { padding: 32px 24px; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; }
        .btn { display: inline-block; background: #059669; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; text-align: center; margin: 15px 0; box-shadow: 0 2px 8px rgba(5, 150, 105, 0.3); }
        .cred-item { margin: 8px 0; font-size: 14px; }
        .cred-label { font-weight: 700; color: #64748b; }
        .cred-value { font-family: monospace; font-size: 15px; font-weight: 700; color: #0f172a; background: #e2e8f0; padding: 2px 8px; border-radius: 6px; }
        .footer { padding: 20px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚡ TiendaFast Delivery</h1>
          <p>Tu plataforma de catálogo y delivery en Puerto Ayacucho</p>
        </div>
        <div class="content">
          <p style="font-size: 16px;">¡Hola! Te damos la bienvenida a <b>TiendaFast</b>. Tu comercio <b>${storeName}</b> ya está registrado y listo para empezar a recibir pedidos.</p>
          
          <div class="card">
            <h3 style="margin-top: 0; color: #059669; font-size: 16px;">🔐 Tus Credenciales de Administrador</h3>
            <div class="cred-item"><span class="cred-label">Panel de Administración:</span> <br/><a href="${loginUrl}" style="color: #059669; font-weight: bold;">${loginUrl}</a></div>
            <div class="cred-item"><span class="cred-label">Usuario:</span> <span class="cred-value">${adminUsername || adminEmail}</span></div>
            <div class="cred-item"><span class="cred-label">Correo Registrado:</span> <span class="cred-value">${adminEmail}</span></div>
            <div class="cred-item"><span class="cred-label">Contraseña inicial:</span> <span class="cred-value">${adminPassword}</span></div>
          </div>

          <div style="text-align: center;">
            <a href="${loginUrl}" class="btn">Entrar a mi Panel de Control</a>
          </div>

          <div class="card">
            <h3 style="margin-top: 0; color: #334155; font-size: 16px;">🌐 La Web Pública de tu Tienda</h3>
            <p style="font-size: 14px; margin-bottom: 8px;">Comparte este enlace con tus clientes en WhatsApp, Instagram y redes sociales:</p>
            <p><a href="${storeUrl}" style="color: #059669; font-weight: bold; font-size: 16px;">${storeUrl}</a></p>
          </div>

          <div class="card">
            <h3 style="margin-top: 0; color: #334155; font-size: 16px;">📦 Tu Plan Suscrito: ${planDisplay}</h3>
            <p style="font-size: 14px; color: #475569;">
              Estado: <b>Prueba Gratuita (${trialDays} días)</b><br/>
              Válido hasta: <b>${expiryText}</b>
            </p>
            <ul style="padding-left: 20px; font-size: 13px; color: #334155;">
              ${featuresList}
            </ul>
          </div>

          <p style="font-size: 13px; color: #64748b;">
            💡 <i>Consejo: Recuerda ingresar a tu panel para configurar tus números de Pago Móvil, categorías y productos iniciales.</i>
          </p>
        </div>
        <div class="footer">
          TiendaFast SaaS • Puerto Ayacucho, Estado Amazonas • Soporte: +58 416-1804831
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
}

/**
 * 👑 Alerta de Vencimiento de Suscripción (Preventiva antes del corte)
 */
async function sendSubscriptionExpiringWarningEmail({
  to,
  storeName,
  slug,
  planTier = 'EMPRENDEDOR',
  daysRemaining = 3,
  expiresAt,
  adminUrl
}) {
  const loginUrl = adminUrl || `${BASE_URL}/login`;
  const expiryText = expiresAt
    ? new Date(expiresAt).toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric' })
    : `los próximos ${daysRemaining} días`;

  const subject = `⚠️ Tu suscripción a TiendaFast para ${storeName} vence en ${daysRemaining} días`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #fde68a; }
        .header { background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%); padding: 28px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
        .content { padding: 32px 24px; }
        .card { background: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 20px; margin: 20px 0; }
        .btn { display: inline-block; background: #d97706; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; text-align: center; margin: 15px 0; }
        .footer { padding: 20px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Aviso de Renovación de Servicio</h1>
          <p>TiendaFast Delivery • ${storeName}</p>
        </div>
        <div class="content">
          <p style="font-size: 16px;">Estimado administrador de <b>${storeName}</b>,</p>
          
          <div class="card">
            <h3 style="margin-top: 0; color: #b45309; font-size: 16px;">Tu período de servicio vence pronto</h3>
            <p style="font-size: 14px; margin-bottom: 6px;">
              Quedan <b>${daysRemaining} días</b> de tu plan actual (${planTier}).<br/>
              Fecha de vencimiento: <b>${expiryText}</b>.
            </p>
          </div>

          <p style="font-size: 14px; color: #334155;">
            Para evitar que tu catálogo online y recepción de pedidos delivery se suspendan temporalmente, por favor realiza la renovación de tu mensualidad a través de Pago Móvil o transferencia y repórtala al SuperAdmin o desde tu panel.
          </p>

          <div style="text-align: center;">
            <a href="${loginUrl}" class="btn">Ir al Panel de Administración</a>
          </div>

          <p style="font-size: 13px; color: #64748b;">
            Si ya realizaste tu pago o acordaste una extensión con soporte, puedes hacer caso omiso a este mensaje.
          </p>
        </div>
        <div class="footer">
          TiendaFast • Soporte directo en Puerto Ayacucho: +58 416-1804831
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
}

module.exports = {
  sendEmail,
  sendStoreWelcomeEmail,
  sendSubscriptionExpiringWarningEmail
};
