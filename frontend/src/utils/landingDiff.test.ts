import { describe, expect, it } from 'vitest';
import { diffLanding, formatLandingValue, hasLandingChanges } from './landingDiff';

describe('diffLanding', () => {
  it('detecta cambios de textos y WhatsApp', () => {
    const changes = diffLanding(
      { slogan: 'Antes', whatsapp_contact: '+58 412 000 0000' },
      { slogan: 'Después', whatsapp_contact: '+58 412 111 1111' }
    );

    expect(changes.map((change) => change.field)).toEqual(['slogan', 'whatsapp_contact']);
    expect(changes[0]).toMatchObject({ before: 'Antes', after: 'Después' });
  });

  it('muestra un resumen legible de banners y galería', () => {
    const changes = diffLanding(
      { banners: [], gallery_images: [] },
      {
        banners: [{ id: '1', title: '2x1', image_url: 'https://cdn.example.com/b.jpg' }],
        gallery_images: [
          'https://cdn.example.com/1.jpg',
          'https://cdn.example.com/2.jpg'
        ]
      }
    );

    expect(changes.find((change) => change.field === 'banners')?.after).toContain('2x1');
    expect(changes.find((change) => change.field === 'gallery_images')?.after).toBe('2 imagen(es)');
  });

  it('detecta cambios en la visibilidad de secciones', () => {
    const changes = diffLanding(
      { sections_visibility: { contact: true } },
      { sections_visibility: { contact: false } }
    );

    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({
      field: 'sections_visibility.contact',
      label: 'Contacto',
      before: 'Visible',
      after: 'Oculta'
    });
  });

  it('no marca cambios cuando los objetos son equivalentes', () => {
    const config = {
      slogan: 'Igual',
      banners: [{ id: '1', title: 'Promo', image_url: 'https://cdn.example.com/b.jpg' }]
    };

    expect(hasLandingChanges(config, { ...config })).toBe(false);
    expect(diffLanding(config, config)).toEqual([]);
  });

  it('formatea valores vacíos', () => {
    expect(formatLandingValue('slogan', '')).toBe('Vacío');
    expect(formatLandingValue('about_text', null)).toBe('Vacío');
    expect(formatLandingValue('sections_visibility.about', undefined)).toBe('Visible');
  });
});
