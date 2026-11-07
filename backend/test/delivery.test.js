const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ROAD_FACTOR, haversineDistanceKm, estimateMinutes, matchesZone, evaluateCoverage, isInsidePuertoAyacucho } = require('../services/deliveryService');

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

test('delivery: sin zonas siempre está en cobertura', () => {
  const coverage = evaluateCoverage([], 12);
  assert.equal(coverage.has_zones, false);
  assert.equal(coverage.in_range, true);
  assert.equal(coverage.max_distance_km, null);
});

test('delivery: detecta direcciones fuera de cobertura', () => {
  const zones = [
    { min_distance_km: 0, max_distance_km: 5 },
    { min_distance_km: 5, max_distance_km: 10 }
  ];
  assert.equal(evaluateCoverage(zones, 8).in_range, true);
  assert.equal(evaluateCoverage(zones, 10).in_range, true);
  assert.equal(evaluateCoverage(zones, 10.01).in_range, false);
  assert.equal(evaluateCoverage(zones, 10.01).max_distance_km, 10);
});

test('delivery: zona sin máximo cubre cualquier distancia', () => {
  const coverage = evaluateCoverage([{ min_distance_km: 0, max_distance_km: null }], 999);
  assert.equal(coverage.in_range, true);
  assert.equal(coverage.max_distance_km, null);
});

test('delivery: sin coordenadas la cobertura queda indefinida', () => {
  const coverage = evaluateCoverage([{ min_distance_km: 0, max_distance_km: 10 }], null);
  assert.equal(coverage.in_range, null);
  assert.equal(coverage.has_zones, true);
});

test('geofence: reconoce coordenadas centricas de Puerto Ayacucho', () => {
  const res = isInsidePuertoAyacucho(5.6667, -67.6333);
  assert.equal(res.inside, true);
});

test('geofence: reconoce coordenadas periurbanas validas de Atures', () => {
  const res = isInsidePuertoAyacucho(5.62, -67.61);
  assert.equal(res.inside, true);
});

test('geofence: rechaza coordenadas de otras ciudades como Caracas', () => {
  const res = isInsidePuertoAyacucho(10.50, -66.90);
  assert.equal(res.inside, false);
});

test('geofence: rechaza direcciones de texto de otros estados', () => {
  const res = isInsidePuertoAyacucho(null, null, 'Av. Francisco de Miranda, Caracas');
  assert.equal(res.inside, false);
});
