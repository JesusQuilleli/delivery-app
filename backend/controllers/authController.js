const prisma = require('../prismaClient');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const { Resend } = require('resend');

const checkEmail = async (req, res) => {
  try {
    const { email, store_id } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'El correo electrónico es requerido' });
    }

    // Rate Limiting Básico: Verificar si ya hay un código muy reciente (menos de 1 minuto)
    const recentCode = await prisma.verificationCode.findFirst({
      where: {
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

    // Borramos los códigos anteriores de este correo para evitar duplicidad
    await prisma.verificationCode.deleteMany({
      where: { email }
    });

    // Guardamos el nuevo código
    await prisma.verificationCode.create({
      data: {
        email,
        code,
        expires_at
      }
    });

    // Verificar si el usuario ya existe
    const user = await prisma.user.findUnique({ where: { email } });
    const is_registered = user && user.name ? true : false;

    // Obtener nombre de la tienda
    let storeName = 'TiendaFast';
    if (store_id) {
      const store = await prisma.store.findUnique({ where: { id: Number(store_id) } });
      if (store && store.name) {
        storeName = store.name;
      }
    }

    // ENVÍO DE EMAIL MEDIANTE RESEND
    try {
      const resendApiKey = process.env.RESEND_API_KEY;
      
      if (resendApiKey) {
        const resend = new Resend(resendApiKey);

        const { data, error } = await resend.emails.send({
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

    res.json({ message: 'Código generado exitosamente. Revisa la consola.', is_registered, user_name: user ? user.name : null, user_phone: user ? user.phone : null });
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

    // Validar que el código exista y no esté expirado
    const verification = await prisma.verificationCode.findFirst({
      where: {
        email,
        code,
        expires_at: {
          gt: new Date() // La fecha de expiración debe ser mayor a la actual
        }
      }
    });

    if (!verification) {
      return res.status(400).json({ error: 'Código inválido o ha expirado' });
    }

    // Buscamos si el usuario ya existe por su correo
    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || null,
          phone: phone || null,
          store_id: Number(store_id)
        }
      });
    } else {
      // Update name and phone if provided
      const updateData = {};
      if (name && (!user.name || name !== user.name)) updateData.name = name;
      if (phone && (!user.phone || phone !== user.phone)) updateData.phone = phone;

      if (Object.keys(updateData).length > 0) {
        user = await prisma.user.update({
          where: { email },
          data: updateData
        });
      }
    }

    // Borramos el código para que no se re-utilice
    await prisma.verificationCode.deleteMany({
      where: { email }
    });

    // Generar JWT
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
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
        email: user.email,
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
      where: { username },
      include: { store: true }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return res.status(401).json({ error: 'Credenciales inválidas o no tienes permisos' });
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
        store_id: user.store_id,
        store: user.store ? { slug: user.store.slug } : null
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno al iniciar sesión' });
  }
};

module.exports = { checkEmail, verifyOtp, adminLogin };
