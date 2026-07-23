const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');

// JWT_SECRET obligatorio — el servidor no debe arrancar sin él
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET no está configurado en las variables de entorno. El servidor no puede arrancar de forma segura.');
  process.exit(1);
}

const requireAuth = (req, res, next) => {
  // Leer desde cookie httpOnly (nueva forma segura)
  const token = req.cookies?.auth_token;

  if (!token) {
    return res.status(401).json({ error: 'No se proporcionó token de autenticación' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

const requireAdmin = (req, res, next) => {
  requireAuth(req, res, () => {
    if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'SUPERADMIN')) {
      next();
    } else {
      return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de Administrador.' });
    }
  });
};

const requireSuperAdmin = (req, res, next) => {
  requireAuth(req, res, () => {
    if (req.user && req.user.role === 'SUPERADMIN') {
      next();
    } else {
      return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de Super Administrador.' });
    }
  });
};

/**
 * Middleware de aislamiento tienda-admin (previene IDOR).
 * SUPERADMIN puede acceder a cualquier tienda.
 * ADMIN solo puede acceder a la tienda a la que pertenece (req.user.store_id === store.id).
 */
const requireStoreAdmin = async (req, res, next) => {
  // Primero verificar que tenga el rol adecuado
  requireAdmin(req, res, async () => {
    if (req.user.role === 'SUPERADMIN') {
      return next();
    }

    const { slug } = req.params;
    if (!slug) {
      // Si no hay slug en la ruta, dejar pasar (rutas sin slug como /products/:id)
      return next();
    }

    try {
      const store = await prisma.store.findUnique({ where: { slug } });
      if (!store) {
        return res.status(404).json({ error: 'Tienda no encontrada' });
      }

      if (store.id !== req.user.store_id) {
        return res.status(403).json({ error: 'Acceso denegado. No tienes permisos sobre esta tienda.' });
      }

      next();
    } catch (err) {
      console.error('Error en requireStoreAdmin:', err);
      return res.status(500).json({ error: 'Error interno verificando permisos' });
    }
  });
};

module.exports = { requireAuth, requireAdmin, requireSuperAdmin, requireStoreAdmin, JWT_SECRET };
