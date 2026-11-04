const { Prisma } = require('@prisma/client');

const convert = (value) => {
  if (value === null || value === undefined) return value;
  if (Prisma.Decimal.isDecimal(value)) return value.toNumber();
  if (Array.isArray(value)) return value.map(convert);
  if (value instanceof Date || Buffer.isBuffer(value)) return value;
  if (typeof value === 'object') {
    const result = {};
    for (const key of Object.keys(value)) {
      result[key] = convert(value[key]);
    }
    return result;
  }
  return value;
};

module.exports = (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body) => originalJson(convert(body));
  next();
};
