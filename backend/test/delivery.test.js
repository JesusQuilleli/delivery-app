const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ROAD_FACTOR, haversineDistanceKm, estimateMinutes, matchesZone } = require('../services/deliveryService');

test('delivery: distancia 0 en el mismo punto', () => {
  assert.equal(haversineDistanceKm(5.6667, -67.6333, 5.6667, -67.6333), 0);
});

test('delivery: distancia usa factor de ruta', () => {
  const km = haversineDistanceKm(5.6667, -67.6333, 5.6767, -67.6333);
  assert.ok(km > 1 && km < 3, `distancia inesperada: ${km}`);
  assert.ok(ROAD_FACTOR > 1);
});

test('delivery: estimación de minutos', () => {
  assert.equal(estimateMinutes(0), 15);
  assert.equal(estimateMinutes(25), 75);
});

test('delivery: matching de zonas por rango', () => {
  assert.equal(matchesZone({ min_distance_km: 0, max_distance_km: 5 }, 3), true);
  assert.equal(matchesZone({ min_distance_km: 5, max_distance_km: 10 }, 4.99), false);
  assert.equal(matchesZone({ min_distance_km: 5, max_distance_km: null }, 500), true);
});
