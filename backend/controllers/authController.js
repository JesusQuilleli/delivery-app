const prisma = require('../prismaClient');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const { Resend } = require('resend');
const { splitPhone } = require('../utils/phone');

// Configuración de cookies compartida
// `Partitioned` permite que Safari/iOS (ITP) acepte y envíe la cookie en contexto
// cross-site (frontend en un dominio distinto al de la API), aunque la cookie
// no persista al cerrar el navegador. Es un puente mientras se migra al mismo
// dominio con proxy. En same-site, `Partitioned` no tiene efecto negativo.
const COOKIE_OPTIONS_CLIENT = {
  httpOnly: true,
  secure: true,
  sameSite: 'None',
  partitioned: true,
  maxAge: 30 * 24 * 60 * 60 * 1000 // 30 días
};

const COOKIE_OPTIONS_ADMIN = {
  httpOnly: true,
  secure: true,
  sameSite: 'None',
  partitioned: true,
  maxAge: 24 * 60 * 60 * 1000 // 1 día
};

const checkEmail = async (req, res) => {
  try {
    const { email, store_id } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'El correo electrónico es requerido' });
    }

    const storeId = Number(store_id);
    if (!storeId) {
      return res.status(400).json({ error: 'La tienda es requerida' });
    }

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store || !store.is_active) {
      return res.status(404).json({ error: 'Tienda no disponible' });
    }

    // Rate Limiting Básico: Verificar si ya hay un código muy reciente (menos de 1 minuto)
    const recentCode = await prisma.verificationCode.findFirst({
      where: {
        store_id: storeId,
        email,
        expires_at: {
          gt: new Date(Date.now() + 9 * 60 * 1000) // Si caduca en más de 9 minutos, se creó hace menos de 1 minuto
        }
      }
    });

    if (recentCode) {
      return res.status(429).json({ error: 'Por favor, espera un minuto antes de solicitar otro código.' });
    }

    // Generar código OTP de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos de validez

    // Borramos los códigos anteriores de este correo en esta tienda para evitar duplicidad
    await prisma.verificationCode.deleteMany({
      where: { store_id: storeId, email }
    });

    // Guardamos el nuevo código
    await prisma.verificationCode.create({
      data: {
        store_id: storeId,
        email,
        code,
        expires_at
      }
    });

    // Verificar si el usuario ya existe en esta tienda
    const user = await prisma.user.findFirst({
      where: { email, store_id: storeId }
    });
    const is_registered = user && user.name ? true : false;

    const storeName = store.name || 'TiendaFast';

    // ENVÍO DE EMAIL MEDIANTE RESEND
    try {
      const resendApiKey = process.env.RESEND_API_KEY;

      if (resendApiKey) {
        const resend = new Resend(resendApiKey);

        const { error } = await resend.emails.send({
          from: 'App Delivery <no-reply@shop-mg.com>',
          to: email,
          subject: `Tu código de acceso: ${code}`,
          html: `
            <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
              <h2>¡Hola! Bienvenido a <b>${storeName}</b> ⚡</h2>
              <p>Tu código de verificación es:</p>
              <h1 style="font-size: 36px; letter-spacing: 5px; color: #f97316; margin: 10px 0;">${code}</h1>
              <p style="color: #666;"><i>Válido por 10 minutos. No compartas este código con nadie.</i></p>
            </div>
          `
        });

        if (error) {
          console.error('Error de API Resend:', error);
        } else {
          console.log(`✉️ [Email] Código enviado a ${email} via Resend`);
        }
      } else {
        console.log(`✉️ [Email Simulator] (Falta RESEND_API_KEY) Mensaje a ${email}: Tu código es ${code}`);
      }
    } catch (emailErr) {
      console.error('Error enviando Email:', emailErr);
    }

    const registeredPhone = user && user.phone ? splitPhone(user.phone) : null;

    res.json({
      message: 'Código generado exitosamente.',
      is_registered,
      user_name: user ? user.name : null,
      user_phone: registeredPhone?.isValid ? registeredPhone.e164 : user?.phone || null,
      user_phone_country_code: registeredPhone?.isValid ? registeredPhone.countryCode : null,
      user_phone_number: registeredPhone?.isValid ? registeredPhone.nationalNumber : null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar código OTP' });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, code, store_id, name, phone } = req.body;

    if (!email || !code || !store_id) {
      return res.status(400).json({ error: 'Faltan datos (email, code, store_id)' });
    }

    const normalizedPhone = phone ? splitPhone(phone) : null;
    if (phone && !normalizedPhone.isValid) {
      return res.status(400).json({ error: 'El número de teléfono no es válido. Verifica el país y el número.' });
    }

    const storeId = Number(store_id);
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store || !store.is_active) {
      return res.status(404).json({ error: 'Tienda no disponible' });
    }

    // Validar que el código exista para esta tienda y no esté expirado
    const verification = await prisma.verificationCode.findFirst({
      where: {
        store_id: storeId,
        email,
        code,
        expires_at: {
          gt: new Date()
        }
      }
    });

    if (!verification) {
      return res.status(400).json({ error: 'Código inválido o ha expirado' });
    }

    // Buscamos si el usuario ya existe por su correo dentro de esta tienda
    let user = await prisma.user.findFirst({
      where: { email, store_id: storeId }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || null,
          phone: normalizedPhone?.isValid ? normalizedPhone.e164 : null,
          store_id: storeId
        }
      });
    } else {
      const updateData = {};
      if (name && (!user.name || name !== user.name)) updateData.name = name;
      if (normalizedPhone?.isValid && normalizedPhone.e164 !== splitPhone(user.phone).e164) {
        updateData.phone = normalizedPhone.e164;
      }

      if (Object.keys(updateData).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updateData
        });
      }
    }

    // Borramos los códigos de este correo en esta tienda para que no se re-utilicen
    await prisma.verificationCode.deleteMany({
      where: { store_id: storeId, email }
    });

    // Generar JWT
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email, store_id: user.store_id },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Enviar JWT en cookie httpOnly (no expuesto a JS del cliente)
    res.cookie('auth_token', token, COOKIE_OPTIONS_CLIENT);

    res.json({
      message: 'Autenticación exitosa',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Ese teléfono ya está registrado en esta tienda. Usa otro número o ingresa con tu correo.'
      });
    }
    res.status(500).json({ error: 'Error interno al verificar OTP' });
  }
};

const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: { store: true }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return res.status(401).json({ error: 'Credenciales inválidas o no tienes permisos' });
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const minutesLeft = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      return res.status(423).json({ error: `Cuenta bloqueada. Intenta de nuevo en ${minutesLeft} minuto(s).` });
    }

    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.password);
    } catch {
      isMatch = false;
    }

    if (!isMatch) {
      const attempts = user.failed_attempts + 1;
      const updateData = { failed_attempts: attempts };
      if (attempts >= 5) {
        updateData.locked_until = new Date(Date.now() + 15 * 60 * 1000);
        console.log(`🔒 Cuenta ${username} bloqueada por 15 min (${attempts} intentos fallidos)`);
      }
      await prisma.user.update({ where: { id: user.id }, data: updateData });
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (user.failed_attempts > 0) {
      await prisma.user.update({ where: { id: user.id }, data: { failed_attempts: 0, locked_until: null } });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, username: user.username, store_id: user.store_id },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.cookie('auth_token', token, COOKIE_OPTIONS_ADMIN);

    res.json({
      message: 'Inicio de sesión exitoso',
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        store_id: user.store_id,
        store: user.store ? { slug: user.store.slug } : null
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno al iniciar sesión' });
  }
};

const logout = (req, res) => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    partitioned: true
  });
  res.json({ message: 'Sesión cerrada exitosamente' });
};

const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Debes proporcionar la contraseña actual y la nueva contraseña.' });
    }

    if (typeof new_password !== 'string' || new_password.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.password) {
      return res.status(404).json({ error: 'Usuario no encontrado o no tiene contraseña configurada.' });
    }

    const isMatch = await bcrypt.compare(current_password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta.' });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword, failed_attempts: 0, locked_until: null }
    });

    res.json({ message: 'Contraseña actualizada exitosamente.' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ error: 'Error interno al cambiar contraseña.' });
  }
};

const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.auth_token;
    if (!token) {
      return res.status(401).json({ error: 'No hay sesión activa' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = decoded.exp - now;

    if (expiresIn < 3600) {
      const newPayload = { id: decoded.id, role: decoded.role, store_id: decoded.store_id };
      if (decoded.username) newPayload.username = decoded.username;
      if (decoded.email) newPayload.email = decoded.email;

      const newToken = jwt.sign(newPayload, JWT_SECRET, { expiresIn: '1d' });
      const cookieOptions = decoded.role === 'CLIENT' ? COOKIE_OPTIONS_CLIENT : COOKIE_OPTIONS_ADMIN;
      res.cookie('auth_token', newToken, cookieOptions);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { store: { select: { slug: true } } }
    });

    res.json({
      user: {
        id: decoded.id,
        name: user?.name || null,
        role: decoded.role,
        username: decoded.username,
        email: decoded.email,
        store_id: decoded.store_id,
        store: user?.store || null
      }
    });
  } catch (error) {
    return res.status(401).json({ error: 'Sesión expirada' });
  }
};

module.exports = { checkEmail, verifyOtp, adminLogin, logout, refreshToken, changePassword };
