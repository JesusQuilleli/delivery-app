// backend/utils/dates.js
// Manejo de zonas horarias y rangos de fechas en America/Caracas (UTC-4)

const CARACAS_TIMEZONE = 'America/Caracas';

/**
 * Retorna la fecha actual o dada formateada como 'YYYY-MM-DD' en la zona horaria de Caracas.
 */
function getCaracasDateString(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: CARACAS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(d);
}

/**
 * Retorna el inicio del día (00:00:00.000-04:00) en Caracas como objeto Date UTC.
 */
function getCaracasStartOfDay(date = new Date()) {
  const ymd = getCaracasDateString(date);
  return new Date(`${ymd}T00:00:00.000-04:00`);
}

/**
 * Retorna el final del día (23:59:59.999-04:00) en Caracas como objeto Date UTC.
 */
function getCaracasEndOfDay(date = new Date()) {
  const ymd = getCaracasDateString(date);
  return new Date(`${ymd}T23:59:59.999-04:00`);
}

/**
 * Retorna el inicio del mes (primer día a las 00:00:00.000-04:00) en Caracas como objeto Date UTC.
 */
function getCaracasStartOfMonth(date = new Date()) {
  const ymd = getCaracasDateString(date);
  const ym = ymd.slice(0, 7);
  return new Date(`${ym}-01T00:00:00.000-04:00`);
}

/**
 * Convierte parámetros `from` y `to` a un filtro `createdAt` de Prisma respetando America/Caracas.
 * Acepta 'YYYY-MM-DD', 'YYYY-MM-DDTHH:mm:ss' o instancias de Date.
 */
function parseCaracasDateRange(from, to) {
  const filter = {};

  if (from) {
    const fromStr = String(from).trim().split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(fromStr)) {
      filter.gte = new Date(`${fromStr}T00:00:00.000-04:00`);
    } else {
      const parsed = new Date(from);
      if (!isNaN(parsed.getTime())) filter.gte = parsed;
    }
  }

  if (to) {
    const toStr = String(to).trim().split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(toStr)) {
      filter.lte = new Date(`${toStr}T23:59:59.999-04:00`);
    } else {
      const parsed = new Date(to);
      if (!isNaN(parsed.getTime())) filter.lte = parsed;
    }
  }

  return Object.keys(filter).length > 0 ? filter : null;
}

module.exports = {
  CARACAS_TIMEZONE,
  getCaracasDateString,
  getCaracasStartOfDay,
  getCaracasEndOfDay,
  getCaracasStartOfMonth,
  parseCaracasDateRange
};
