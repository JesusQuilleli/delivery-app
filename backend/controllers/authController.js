const prisma = require('../prismaClient');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const checkPhone = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'El teléfono es requerido' });
    }

    // Rate Limiting Básico: Verificar si ya hay un código muy reciente (menos de 1 minuto)
    const recentCode = await prisma.verificationCode.findFirst({
      where: {
        phone,
        expires_at: {
          gt: new Date(Date.now() + 9 * 60 * 1000) // Si caduca en más de 9 minutos, se creó hace menos de 1 minuto
        }
      }
    });

    if (recentCode) {
      return res.status(429).json({ error: 'Por favor, espera un minuto antes de solicitar otro código.' });
    }

    // Generar código OTP de 4 dígitos
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos de validez

    // Borramos los códigos anteriores de este teléfono para evitar duplicidad
    await prisma.verificationCode.deleteMany({
      where: { phone }
    });

    // Guardamos el nuevo código
    await prisma.verificationCode.create({
      data: {
        phone,
        code,
        expires_at
      }
    });

    // Verificar si el usuario ya existe
    const user = await prisma.user.findUnique({ where: { phone } });
    const is_registered = user && user.name ? true : false;

    // ENVÍO DE WHATSAPP REAL MEDIANTE ULTRAMSG
    try {
      const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
      const token = process.env.ULTRAMSG_TOKEN;
      if (instanceId && token) {
        const url = `https://api.ultramsg.com/${instanceId}/messages/chat`;
        
        // Clean phone number (remove +, spaces, dashes, etc.)
        const cleanPhone = phone.replace(/\D/g, '');
        
        const body = new URLSearchParams({
          token: token,
          to: cleanPhone,
          body: `¡Hola! Bienvenido a *TiendaFast* ⚡\n\nTu código de verificación es: *${code}*\n\n_Válido por 10 minutos. No compartas este código con nadie._`
        });

        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString()
        });
        console.log(`📱 [WhatsApp] Mensaje enviado a ${cleanPhone}`);
      } else {
        console.log(`📱 [WhatsApp Simulator] Mensaje a ${phone}: Tu código es ${code}`);
      }
    } catch (wsErr) {
      console.error('Error enviando WhatsApp:', wsErr);
    }

    res.json({ message: 'Código generado exitosamente. Revisa la consola.', is_registered, user_name: user ? user.name : null });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar código OTP' });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { phone, code, store_id, name } = req.body;

    if (!phone || !code || !store_id) {
      return res.status(400).json({ error: 'Faltan datos (phone, code, store_id)' });
    }

    // Validar que el código exista y no esté expirado
    const verification = await prisma.verificationCode.findFirst({
      where: {
        phone,
        code,
        expires_at: {
          gt: new Date() // La fecha de expiración debe ser mayor a la actual
        }
      }
    });

    if (!verification) {
      return res.status(400).json({ error: 'Código inválido o ha expirado' });
    }

    // Buscamos si el usuario ya existe por su teléfono
    let user = await prisma.user.findUnique({
      where: { phone }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone,
          name: name || null,
          store_id: Number(store_id)
        }
      });
    } else if (name && !user.name) {
      user = await prisma.user.update({
        where: { phone },
        data: { name }
      });
    } else if (name && user.name && name !== user.name) {
      // Permitir actualizar el nombre si lo enviaron explícitamente y es diferente
      user = await prisma.user.update({
        where: { phone },
        data: { name }
      });
    }

    // Borramos el código para que no se re-utilice
    await prisma.verificationCode.deleteMany({
      where: { phone }
    });

    // Generar JWT
    const token = jwt.sign(
      { id: user.id, role: user.role, phone: user.phone },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Devolvemos el token (lo llamamos client_token para mantener compatibilidad con el frontend actual)
    res.json({
      message: 'Autenticación exitosa',
      client_token: token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
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
      where: { username }
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(401).json({ error: 'Credenciales inválidas o no eres administrador' });
    }

    // Verificar contraseña encriptada (o texto plano para retrocompatibilidad temporal si falla bcrypt y la db no se migró)
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.password);
    } catch(err) {
      // Fallback
    }

    if (!isMatch && user.password !== password) {
       return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar JWT
    const token = jwt.sign(
      { id: user.id, role: user.role, username: user.username },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Inicio de sesión exitoso',
      client_token: token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        store_id: user.store_id
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno al iniciar sesión' });
  }
};

module.exports = { checkPhone, verifyOtp, adminLogin };
