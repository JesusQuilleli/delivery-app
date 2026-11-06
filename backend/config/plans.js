const PLANS = {
  EMPRENDEDOR: {
    code: 'EMPRENDEDOR',
    name: 'Emprendedor',
    priceUSD: 15,
    maxProducts: 50,
    maxAdmins: 1,
    features: ['Catálogo digital', 'Pedidos en tiempo real', 'Delivery con GPS', '1 Administrador']
  },
  NEGOCIO: {
    code: 'NEGOCIO',
    name: 'Negocio',
    priceUSD: 30,
    maxProducts: 250,
    maxAdmins: 3,
    features: ['Combos ilimitados', 'Múltiples zonas de reparto', 'Historial y exportación CSV', 'Hasta 3 Administradores']
  },
  PRO: {
    code: 'PRO',
    name: 'Pro / Cadena',
    priceUSD: 50,
    maxProducts: 1000,
    maxAdmins: 10,
    features: ['Productos ilimitados (hasta 1000)', 'Reportes avanzados', 'Motorizados ilimitados', 'Soporte prioritario']
  }
};

const DEFAULT_PLAN = 'EMPRENDEDOR';

function getPlan(code) {
  const normalized = (code || '').toUpperCase().trim();
  return PLANS[normalized] || PLANS[DEFAULT_PLAN];
}

module.exports = {
  PLANS,
  DEFAULT_PLAN,
  getPlan
};
