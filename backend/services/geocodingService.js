const DEFAULT_CENTER = { latitude: 5.6667, longitude: -67.6333 };
const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 300;
const MAX_RESULTS = 5;

const cache = new Map();

const toFiniteNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const cleanText = (value, max = 500) => {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, max);
};

const buildViewbox = (latitude, longitude, delta = 0.12) => {
  const lat = toFiniteNumber(latitude);
  const lon = toFiniteNumber(longitude);
  if (lat === null || lon === null) return null;
  const left = Math.max(-180, lon - delta);
  const right = Math.min(180, lon + delta);
  const top = Math.min(90, lat + delta);
  const bottom = Math.max(-90, lat - delta);
  return `${left.toFixed(6)},${top.toFixed(6)},${right.toFixed(6)},${bottom.toFixed(6)}`;
};

const normalizeCenter = (latitude, longitude) => {
  const lat = toFiniteNumber(latitude);
  const lon = toFiniteNumber(longitude);
  if (lat === null || lon === null) return { ...DEFAULT_CENTER };
  return { latitude: lat, longitude: lon };
};

const normalizeComponents = (address = {}) => ({
  road: cleanText(address.road || address.pedestrian || address.footway, 160) || null,
  neighbourhood: cleanText(address.neighbourhood || address.suburb || address.quarter, 120) || null,
  city: cleanText(address.city || address.town || address.village || address.municipality, 120) || null,
  state: cleanText(address.state || address.region, 120) || null,
  country: cleanText(address.country, 120) || null,
  postcode: cleanText(address.postcode, 30) || null
});

const formatDisplayName = (raw, components) => {
  const display = cleanText(raw, 400);
  if (display) return display.replace(/, Venezuela$/i, '').trim();
  return [components.road, components.neighbourhood, components.city, components.state]
    .filter(Boolean)
    .join(', ');
};

const normalizeSuggestion = (item) => {
  const latitude = toFiniteNumber(item.lat);
  const longitude = toFiniteNumber(item.lon);
  if (latitude === null || longitude === null) return null;
  const components = normalizeComponents(item.address);
  return {
    place_id: item.place_id ? String(item.place_id) : null,
    display_name: formatDisplayName(item.display_name || item.display_address, components),
    address: components,
    latitude,
    longitude
  };
};

const normalizeReverse = (item, fallbackLat, fallbackLon) => {
  const components = normalizeComponents(item.address);
  return {
    place_id: item.place_id ? String(item.place_id) : null,
    display_name: formatDisplayName(item.display_name, components),
    address: components,
    latitude: toFiniteNumber(item.lat) ?? fallbackLat,
    longitude: toFiniteNumber(item.lon) ?? fallbackLon
  };
};

const getCache = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  const ttl = Number(process.env.GEOCODING_CACHE_TTL_MS) || DEFAULT_CACHE_TTL_MS;
  if (Date.now() - entry.at > ttl) {
    cache.delete(key);
    return null;
  }
  return entry.value;
};

const setCache = (key, value) => {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) cache.delete(oldestKey);
  }
  cache.set(key, { at: Date.now(), value });
};

const clearCache = () => cache.clear();

const fetchJson = async (url, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.GEOCODING_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(options.headers || {})
      }
    });
    if (!response.ok) {
      throw new Error(`Geocoding provider responded ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
};

const locationIqKey = () => process.env.LOCATIONIQ_KEY || process.env.LOCATIONIQ_ACCESS_TOKEN || '';
const locationIqBase = () => (process.env.GEOCODING_BASE_URL || 'https://us1.locationiq.com/v1').replace(/\/$/, '');
const nominatimBase = () => (process.env.NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org').replace(/\/$/, '');
const nominatimHeaders = () => ({
  'User-Agent': process.env.NOMINATIM_USER_AGENT || 'TiendaFast/1.0 (delivery; contacto@tiendafast.local)'
});

const searchLocationIq = async (query, center) => {
  const key = locationIqKey();
  if (!key) return null;
  const params = new URLSearchParams({
    key,
    q: query,
    limit: String(MAX_RESULTS),
    countrycodes: 've',
    format: 'json',
    'accept-language': 'es'
  });
  const viewbox = buildViewbox(center.latitude, center.longitude);
  if (viewbox) {
    params.set('viewbox', viewbox);
    params.set('bounded', '1');
  }
  const data = await fetchJson(`${locationIqBase()}/autocomplete.php?${params.toString()}`);
  if (!Array.isArray(data)) return [];
  return data.map(normalizeSuggestion).filter(Boolean);
};

const reverseLocationIq = async (latitude, longitude) => {
  const key = locationIqKey();
  if (!key) return null;
  const params = new URLSearchParams({
    key,
    lat: String(latitude),
    lon: String(longitude),
    format: 'json',
    'accept-language': 'es'
  });
  const data = await fetchJson(`${locationIqBase()}/reverse.php?${params.toString()}`);
  if (!data || typeof data !== 'object') return null;
  return normalizeReverse(data, latitude, longitude);
};

const searchNominatim = async (query, center) => {
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    limit: String(MAX_RESULTS),
    countrycodes: 've',
    addressdetails: '1',
    'accept-language': 'es'
  });
  const viewbox = buildViewbox(center.latitude, center.longitude);
  if (viewbox) {
    params.set('viewbox', viewbox);
    params.set('bounded', '1');
  }
  const data = await fetchJson(`${nominatimBase()}/search?${params.toString()}`, { headers: nominatimHeaders() });
  if (!Array.isArray(data)) return [];
  return data.map(normalizeSuggestion).filter(Boolean);
};

const reverseNominatim = async (latitude, longitude) => {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    format: 'jsonv2',
    addressdetails: '1',
    'accept-language': 'es'
  });
  const data = await fetchJson(`${nominatimBase()}/reverse?${params.toString()}`, { headers: nominatimHeaders() });
  if (!data || typeof data !== 'object' || data.error) return null;
  return normalizeReverse(data, latitude, longitude);
};

const autocomplete = async (query, center = DEFAULT_CENTER) => {
  const cleanQuery = cleanText(query, 160);
  if (cleanQuery.length < 3) {
    return { results: [], provider: null, center: normalizeCenter(center.latitude, center.longitude) };
  }

  const normalizedCenter = normalizeCenter(center.latitude, center.longitude);
  const cacheKey = `auto:${cleanQuery.toLowerCase()}:${normalizedCenter.latitude.toFixed(3)}:${normalizedCenter.longitude.toFixed(3)}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  let results = null;
  let provider = null;

  if (locationIqKey()) {
    try {
      results = await searchLocationIq(cleanQuery, normalizedCenter);
      provider = 'locationiq';
    } catch (error) {
      console.error('LocationIQ autocomplete falló, usando Nominatim:', error.message);
    }
  }

  if (results === null) {
    try {
      results = await searchNominatim(cleanQuery, normalizedCenter);
      provider = 'nominatim';
    } catch (error) {
      console.error('Nominatim autocomplete falló:', error.message);
      results = [];
      provider = 'none';
    }
  }

  const payload = {
    results: results.slice(0, MAX_RESULTS),
    provider,
    center: normalizedCenter
  };
  setCache(cacheKey, payload);
  return payload;
};

const reverse = async (latitude, longitude) => {
  const lat = toFiniteNumber(latitude);
  const lon = toFiniteNumber(longitude);
  if (lat === null || lon === null) {
    const error = new Error('Coordenadas inválidas');
    error.statusCode = 400;
    throw error;
  }

  const cacheKey = `rev:${lat.toFixed(5)}:${lon.toFixed(5)}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  let result = null;
  let provider = null;

  if (locationIqKey()) {
    try {
      result = await reverseLocationIq(lat, lon);
      provider = 'locationiq';
    } catch (error) {
      console.error('LocationIQ reverse falló, usando Nominatim:', error.message);
    }
  }

  if (result === null) {
    try {
      result = await reverseNominatim(lat, lon);
      provider = 'nominatim';
    } catch (error) {
      console.error('Nominatim reverse falló:', error.message);
      result = null;
      provider = 'none';
    }
  }

  const payload = {
    ...(result || {
      place_id: null,
      display_name: '',
      address: normalizeComponents(),
      latitude: lat,
      longitude: lon
    }),
    provider
  };
  setCache(cacheKey, payload);
  return payload;
};

module.exports = {
  DEFAULT_CENTER,
  buildViewbox,
  normalizeCenter,
  normalizeComponents,
  normalizeSuggestion,
  normalizeReverse,
  autocomplete,
  reverse,
  clearCache
};
