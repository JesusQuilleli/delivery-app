import { describe, expect, it } from 'vitest';
import { buildDriverMessage, buildGoogleMapsUrl, buildWazeUrl } from './navigation';

describe('navigation', () => {
  it('incluye origen, destino y modo conducción en Google Maps', () => {
    const url = buildGoogleMapsUrl(
      { latitude: 5.6631, longitude: -67.6236 },
      { latitude: 5.6667, longitude: -67.6333 }
    );

    expect(url).toBe(
      'https://www.google.com/maps/dir/?api=1&origin=5.6667,-67.6333&destination=5.6631,-67.6236&travelmode=driving&dir_action=navigate'
    );
  });

  it('omite el origen si la tienda no tiene coordenadas', () => {
    const url = buildGoogleMapsUrl({ latitude: 5.6631, longitude: -67.6236 });

    expect(url).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=5.6631,-67.6236&travelmode=driving&dir_action=navigate'
    );
  });

  it('devuelve null si el pedido no tiene coordenadas', () => {
    expect(buildGoogleMapsUrl({ latitude: null, longitude: null })).toBeNull();
    expect(buildWazeUrl({ latitude: null, longitude: null })).toBeNull();
  });

  it('genera el enlace de Waze con el destino', () => {
    expect(buildWazeUrl({ latitude: 5.6631, longitude: -67.6236 })).toBe(
      'https://waze.com/ul?ll=5.6631,-67.6236&navigate=yes'
    );
  });

  it('incluye la ruta real en el mensaje del motorizado', () => {
    const message = buildDriverMessage(
      {
        latitude: 5.6631,
        longitude: -67.6236,
        user: { name: 'Ana', phone: '+584121234567' },
        delivery_address: 'Calle 1 | Link GMaps: https://example.com',
      },
      { latitude: 5.6667, longitude: -67.6333 }
    );

    expect(message).toContain('origin=5.6667,-67.6333');
    expect(message).toContain('destination=5.6631,-67.6236');
    expect(message).toContain('Calle 1');
    expect(message).not.toContain('Link GMaps');
  });

  it('incluye advertencia de retención de récipe si el pedido lo requiere', () => {
    const message = buildDriverMessage({
      latitude: 5.6631,
      longitude: -67.6236,
      user: { name: 'Pedro' },
      delivery_address: 'Av. 23 de Enero',
      prescription_url: 'https://cloudinary.com/recipe.jpg',
      prescription_type: 'RETAIN_ORIGINAL'
    });
    expect(message).toContain('OBLIGATORIO: Retener el récipe médico original');
  });

  it('incluye advertencia de solo mostrar récipe si es SHOW_ONLY', () => {
    const message = buildDriverMessage({
      latitude: 5.6631,
      longitude: -67.6236,
      user: { name: 'María' },
      delivery_address: 'Barrio Simón Bolívar',
      prescription_type: 'SHOW_ONLY'
    });
    expect(message).toContain('Verificar récipe médico del cliente');
  });
});
