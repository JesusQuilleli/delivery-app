export interface Coordinates {
  latitude?: number | string | null;
  longitude?: number | string | null;
}

function toCoordinate(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function coordinatePair(coords?: Coordinates | null): { lat: number; lng: number } | null {
  if (!coords) return null;
  const lat = toCoordinate(coords.latitude);
  const lng = toCoordinate(coords.longitude);
  if (lat === null || lng === null) return null;
  return { lat, lng };
}

export function buildGoogleMapsUrl(destination?: Coordinates | null, origin?: Coordinates | null): string | null {
  const dest = coordinatePair(destination);
  if (!dest) return null;

  const params = ['api=1'];
  const from = coordinatePair(origin);
  if (from) params.push(`origin=${from.lat},${from.lng}`);
  params.push(`destination=${dest.lat},${dest.lng}`);
  params.push('travelmode=driving');
  params.push('dir_action=navigate');

  return `https://www.google.com/maps/dir/?${params.join('&')}`;
}

export function buildWazeUrl(destination?: Coordinates | null): string | null {
  const dest = coordinatePair(destination);
  if (!dest) return null;
  return `https://waze.com/ul?ll=${dest.lat},${dest.lng}&navigate=yes`;
}

export function buildDriverMessage(order: {
  latitude?: number | string | null;
  longitude?: number | string | null;
  user?: { name?: string | null; phone?: string | null };
  delivery_address?: string | null;
  prescription_url?: string | null;
}, store?: Coordinates | null): string {
  const mapsUrl = buildGoogleMapsUrl(order, store);
  const lines = [
    'Hola! Nuevo pedido para entregar.',
    '',
    `👤 *Cliente:* ${order.user?.name || 'Sin nombre'}`,
    `📞 *Teléfono:* ${order.user?.phone || 'No registrado'}`,
    `🏠 *Dirección:* ${(order.delivery_address || '').split(' | Link GMaps:')[0]}`,
  ];

  if (order.prescription_url) {
    lines.push('', '⚠️ *OBLIGATORIO: Retener el récipe médico original del cliente al entregar.*');
  }

  lines.push('', '📍 *Iniciar Navegación GPS:*', mapsUrl || 'Ubicación no disponible');
  return lines.join('\n');
}
