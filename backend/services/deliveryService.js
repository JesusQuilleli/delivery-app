const { Prisma } = require('@prisma/client');
const prisma = require('../prismaClient');

const ROAD_FACTOR = 1.4;

const toFiniteNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const haversineDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * ROAD_FACTOR;
};

const PUERTO_AYACUCHO_CENTER = { latitude: 5.6667, longitude: -67.6333 };
const PUERTO_AYACUCHO_BBOX = { minLat: 5.40, maxLat: 5.95, minLon: -67.85, maxLon: -67.45 };
const PUERTO_AYACUCHO_MAX_RADIUS_KM = 25;

/**
 * Valida si las coordenadas o dirección pertenecen exclusivamente a Puerto Ayacucho (Municipio Atures, Amazonas).
 */
const isInsidePuertoAyacucho = (latitude, longitude, addressText = '') => {
  const lat = toFiniteNumber(latitude);
  const lon = toFiniteNumber(longitude);

  if (lat !== null && lon !== null) {
    const inBbox = lat >= PUERTO_AYACUCHO_BBOX.minLat &&
                   lat <= PUERTO_AYACUCHO_BBOX.maxLat &&
                   lon >= PUERTO_AYACUCHO_BBOX.minLon &&
                   lon <= PUERTO_AYACUCHO_BBOX.maxLon;
    const distanceKm = haversineDistanceKm(PUERTO_AYACUCHO_CENTER.latitude, PUERTO_AYACUCHO_CENTER.longitude, lat, lon) / ROAD_FACTOR;
    const inRadius = distanceKm <= PUERTO_AYACUCHO_MAX_RADIUS_KM;

    if (!inBbox || !inRadius) {
      return {
        inside: false,
        reason: 'Ubicación fuera del Municipio Atures / Puerto Ayacucho',
        distance_from_center_km: Math.round(distanceKm * 10) / 10
      };
    }
  }

  if (typeof addressText === 'string' && addressText.trim()) {
    const normalized = addressText.toLowerCase();
    const disallowedRegions = ['caracas', 'valencia', 'maracay', 'maracaibo', 'barquisimeto', 'merida', 'san cristobal', 'maturin', 'barcelona', 'puerto la cruz', 'ciudad bolivar', 'puerto ordaz', 'apure', 'guarico'];
    for (const region of disallowedRegions) {
      if (normalized.includes(region)) {
        return {
          inside: false,
          reason: 'Dirección corresponde a otra entidad federal (' + region + ')',
          disallowed_region: region
        };
      }
    }
  }

  return { inside: true };
};
const estimateMinutes = (distanceKm) => Math.round((distanceKm / 25) * 60) + 15;

const matchesZone = (zone, distanceKm) => {
  const min = toFiniteNumber(zone.min_distance_km) ?? 0;
  const max = toFiniteNumber(zone.max_distance_km);
  return distanceKm >= min && (max === null || distanceKm <= max);
};

const evaluateCoverage = (zones, distanceKm) => {
  const activeZones = Array.isArray(zones) ? zones : [];
  if (activeZones.length === 0) {
    return { has_zones: false, in_range: true, max_distance_km: null, zones_count: 0 };
  }

  const maxDistance = activeZones.reduce((max, zone) => {
    const zoneMax = toFiniteNumber(zone.max_distance_km);
    if (zoneMax === null) return Infinity;
    return Math.max(max, zoneMax);
  }, 0);

  if (distanceKm === null || distanceKm === undefined) {
    return {
      has_zones: true,
      in_range: null,
      max_distance_km: Number.isFinite(maxDistance) ? maxDistance : null,
      zones_count: activeZones.length
    };
  }

  return {
    has_zones: true,
    in_range: activeZones.some((zone) => matchesZone(zone, distanceKm)),
    max_distance_km: Number.isFinite(maxDistance) ? maxDistance : null,
    zones_count: activeZones.length
  };
};

const resolveDeliveryFee = async ({ store, latitude, longitude }) => {
  const lat = toFiniteNumber(latitude);
  const lon = toFiniteNumber(longitude);
  const storeLat = toFiniteNumber(store.latitude);
  const storeLon = toFiniteNumber(store.longitude);

  let distanceKm = null;
  if (lat !== null && lon !== null && storeLat !== null && storeLon !== null) {
    distanceKm = Math.round(haversineDistanceKm(storeLat, storeLon, lat, lon) * 100) / 100;
  }

  const zones = await prisma.deliveryZone.findMany({
    where: { store_id: store.id, is_active: true },
    orderBy: { min_distance_km: 'asc' }
  });

  const zone = distanceKm !== null
    ? zones.find((candidate) => matchesZone(candidate, distanceKm)) || null
    : null;

  const coverage = evaluateCoverage(zones, distanceKm);
  const geoCheck = isInsidePuertoAyacucho(lat, lon);
  const isOutsidePuertoAyacucho = lat !== null && lon !== null && !geoCheck.inside;
  const inRange = isOutsidePuertoAyacucho ? false : coverage.in_range;

  const fee = zone
    ? new Prisma.Decimal(zone.fee)
    : new Prisma.Decimal(store.delivery_fee ?? 0);

  return {
    distance_km: distanceKm,
    estimated_minutes: distanceKm === null ? null : estimateMinutes(distanceKm),
    delivery_fee: fee,
    zone,
    in_range: inRange,
    outside_puerto_ayacucho: isOutsidePuertoAyacucho,
    coverage: {
      ...coverage,
      outside_puerto_ayacucho: isOutsidePuertoAyacucho,
      city_scope: 'Puerto Ayacucho, Municipio Atures, Estado Amazonas'
    }
  };
};

module.exports = {
  ROAD_FACTOR,
  haversineDistanceKm,
  estimateMinutes,
  matchesZone,
  evaluateCoverage,
  resolveDeliveryFee,
  isInsidePuertoAyacucho,
  PUERTO_AYACUCHO_CENTER
};
