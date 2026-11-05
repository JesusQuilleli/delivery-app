// backend/test/dates.unit.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  getCaracasDateString,
  getCaracasStartOfDay,
  getCaracasEndOfDay,
  getCaracasStartOfMonth,
  parseCaracasDateRange
} = require('../utils/dates');

test('dates: getCaracasDateString formatea YYYY-MM-DD en UTC-4', () => {
  // A las 02:00 UTC del 6 de noviembre, en Caracas todavía es 5 de noviembre a las 22:00 (10 PM)
  const lateNight = new Date('2026-11-06T02:00:00.000Z');
  assert.equal(getCaracasDateString(lateNight), '2026-11-05');

  // A las 05:00 UTC del 6 de noviembre, en Caracas ya es 6 de noviembre a las 01:00 (1 AM)
  const nextDay = new Date('2026-11-06T05:00:00.000Z');
  assert.equal(getCaracasDateString(nextDay), '2026-11-06');
});

test('dates: getCaracasStartOfDay y getCaracasEndOfDay cubren exactamente 24 horas', () => {
  const ref = new Date('2026-11-05T15:00:00.000Z');
  const start = getCaracasStartOfDay(ref);
  const end = getCaracasEndOfDay(ref);

  assert.equal(start.toISOString(), '2026-11-05T04:00:00.000Z');
  assert.equal(end.toISOString(), '2026-11-06T03:59:59.999Z');
  assert.ok(end.getTime() > start.getTime());
});

test('dates: getCaracasStartOfMonth inicia en el primer día del mes a las 00:00 en Caracas', () => {
  const midMonth = new Date('2026-11-15T12:00:00.000Z');
  const startMonth = getCaracasStartOfMonth(midMonth);
  assert.equal(startMonth.toISOString(), '2026-11-01T04:00:00.000Z');
});

test('dates: parseCaracasDateRange maneja YYYY-MM-DD y rangos abiertos', () => {
  const full = parseCaracasDateRange('2026-11-01', '2026-11-05');
  assert.equal(full.gte.toISOString(), '2026-11-01T04:00:00.000Z');
  assert.equal(full.lte.toISOString(), '2026-11-06T03:59:59.999Z');

  const onlyFrom = parseCaracasDateRange('2026-11-01', null);
  assert.equal(onlyFrom.gte.toISOString(), '2026-11-01T04:00:00.000Z');
  assert.equal(onlyFrom.lte, undefined);

  const onlyTo = parseCaracasDateRange(null, '2026-11-05');
  assert.equal(onlyTo.gte, undefined);
  assert.equal(onlyTo.lte.toISOString(), '2026-11-06T03:59:59.999Z');

  const empty = parseCaracasDateRange(null, null);
  assert.equal(empty, null);
});
