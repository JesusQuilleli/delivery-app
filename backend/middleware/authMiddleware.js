const jwt = require('jsonwebtoken');

// Clave secreta (en producción debería estar en el .env)
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_delivery_app';

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No se proporcionó token de autenticación' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Formato de token inválido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, role, phone, ... }
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

const requireAdmin = (req, res, next) => {
  requireAuth(req, res, () => {
    if (req.user && req.user.role === 'ADMIN') {
      next();
    } else {
      return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de Administrador.' });
    }
  });
};

module.exports = { requireAuth, requireAdmin, JWT_SECRET };
