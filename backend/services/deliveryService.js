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

const estimateMinutes = (distanceKm) => Math.round((distanceKm / 25) * 60) + 15;

const matchesZone = (zone, distanceKm) => {
  const min = toFiniteNumber(zone.min_distance_km) ?? 0;
  const max = toFiniteNumber(zone.max_distance_km);
  return distanceKm >= min && (max === null || distanceKm <= max);
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

  let zone = null;
  if (distanceKm !== null) {
    const zones = await prisma.deliveryZone.findMany({
      where: { store_id: store.id, is_active: true },
      orderBy: { min_distance_km: 'asc' }
    });
    zone = zones.find((candidate) => matchesZone(candidate, distanceKm)) || null;
  }

  const fee = zone
    ? new Prisma.Decimal(zone.fee)
    : new Prisma.Decimal(store.delivery_fee ?? 0);

  return {
    distance_km: distanceKm,
    estimated_minutes: distanceKm === null ? null : estimateMinutes(distanceKm),
    delivery_fee: fee,
    zone
  };
};

module.exports = {
  ROAD_FACTOR,
  haversineDistanceKm,
  estimateMinutes,
  matchesZone,
  resolveDeliveryFee
};
