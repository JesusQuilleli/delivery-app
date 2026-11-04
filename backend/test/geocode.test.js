const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  DEFAULT_CENTER,
  buildViewbox,
  normalizeCenter,
  normalizeComponents,
  normalizeSuggestion,
  normalizeReverse
} = require('../services/geocodingService');

test('geocode: viewbox se centra en la tienda y respeta límites', () => {
  const viewbox = buildViewbox(5.6667, -67.6333, 0.1);
  assert.equal(viewbox, '-67.733300,5.766700,-67.533300,5.566700');
  assert.equal(buildViewbox(null, null), null);
});

test('geocode: viewbox no sale de los límites geográficos', () => {
  const viewbox = buildViewbox(89.95, 179.95, 0.2);
  assert.equal(viewbox, '179.750000,90.000000,180.000000,89.750000');
});

test('geocode: center usa default si faltan coordenadas', () => {
  assert.deepEqual(normalizeCenter(undefined, ''), DEFAULT_CENTER);
  assert.deepEqual(normalizeCenter('10.5', '-66.9'), { latitude: 10.5, longitude: -66.9 });
});

test('geocode: normaliza sugerencia de LocationIQ/Nominatim', () => {
  const suggestion = normalizeSuggestion({
    place_id: 123,
    lat: '5.66',
    lon: '-67.63',
    display_name: 'Av. Orinoco, Puerto Ayacucho, Venezuela',
    address: { road: 'Av. Orinoco', suburb: 'Centro', city: 'Puerto Ayacucho' }
  });
  assert.equal(suggestion.display_name, 'Av. Orinoco, Puerto Ayacucho');
  assert.equal(suggestion.latitude, 5.66);
  assert.equal(suggestion.longitude, -67.63);
  assert.equal(suggestion.address.road, 'Av. Orinoco');
  assert.equal(suggestion.address.neighbourhood, 'Centro');
});

test('geocode: descarta sugerencias sin coordenadas válidas', () => {
  assert.equal(normalizeSuggestion({ lat: '', lon: null, display_name: 'X' }), null);
});

test('geocode: reverse normaliza dirección y componentes', () => {
  const reversed = normalizeReverse({
    lat: '5.6667',
    lon: '-67.6333',
    display_name: 'Sector 57, Puerto Ayacucho, Venezuela',
    address: { road: 'Calle 5', neighbourhood: 'Sector 57', city: 'Puerto Ayacucho', state: 'Amazonas' }
  }, 1, 2);
  assert.equal(reversed.display_name, 'Sector 57, Puerto Ayacucho');
  assert.equal(reversed.address.city, 'Puerto Ayacucho');
  assert.equal(reversed.address.state, 'Amazonas');
});

test('geocode: componentes vacíos quedan en null', () => {
  const components = normalizeComponents({});
  assert.equal(components.road, null);
  assert.equal(components.city, null);
  assert.equal(components.country, null);
});
