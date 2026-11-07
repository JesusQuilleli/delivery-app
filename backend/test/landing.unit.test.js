const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { normalizeLandingConfig, LandingValidationError } = require('../utils/landing');

describe('landing utils (unit)', () => {
  it('normaliza una configuración completa', () => {
    const config = normalizeLandingConfig({
      slogan: 'Tu tienda, más cerca',
      subtitle: 'Catálogo y pedidos en línea',
      whatsapp_contact: '+58 412 123 4567',
      hero_image_url: 'https://cdn.example.com/hero.jpg',
      banners: [
        { id: 'promo-1', title: '2x1', subtitle: 'Solo hoy', image_url: 'https://cdn.example.com/banner.jpg' }
      ],
      gallery_images: ['https://cdn.example.com/local.jpg'],
      about_images: ['https://cdn.example.com/about.jpg'],
      sections_visibility: { categories: true, contact: false, testimonials: true }
    });

    assert.equal(config.slogan, 'Tu tienda, más cerca');
    assert.equal(config.whatsapp_contact, '+58 412 123 4567');
    assert.equal(config.banners.length, 1);
    assert.equal(config.banners[0].id, 'promo-1');
    assert.equal(config.gallery_images.length, 1);
    assert.equal(config.about_images.length, 1);
    assert.equal(config.sections_visibility.contact, false);
    assert.equal(config.sections_visibility.categories, true);
  });

  it('conserva campos no enviados del borrador actual', () => {
    const current = {
      slogan: 'Actual',
      subtitle: 'Subtítulo actual',
      whatsapp_contact: '+58 412 000 0000',
      sections_visibility: { categories: true, offers: false }
    };
    const config = normalizeLandingConfig({ subtitle: 'Nuevo subtítulo' }, current);

    assert.equal(config.slogan, 'Actual');
    assert.equal(config.subtitle, 'Nuevo subtítulo');
    assert.equal(config.whatsapp_contact, '+58 412 000 0000');
    assert.equal(config.sections_visibility.offers, false);
  });

  it('permite borrar campos enviando texto vacío', () => {
    const config = normalizeLandingConfig({
      slogan: '',
      subtitle: '',
      whatsapp_contact: '',
      hero_image_url: ''
    }, {
      slogan: 'Viejo',
      subtitle: 'Viejo',
      whatsapp_contact: '+58 412 000 0000',
      hero_image_url: 'https://cdn.example.com/hero.jpg'
    });

    assert.equal(config.slogan, null);
    assert.equal(config.subtitle, null);
    assert.equal(config.whatsapp_contact, null);
    assert.equal(config.hero_image_url, null);
  });

  it('rechaza HTML y javascript en textos', () => {
    assert.throws(
      () => normalizeLandingConfig({ slogan: '<script>alert(1)</script>' }),
      LandingValidationError
    );
    assert.throws(
      () => normalizeLandingConfig({ subtitle: 'javascript:alert(1)' }),
      LandingValidationError
    );
  });

  it('rechaza imágenes que no usan https', () => {
    assert.throws(
      () => normalizeLandingConfig({ hero_image_url: 'http://cdn.example.com/hero.jpg' }),
      LandingValidationError
    );
    assert.throws(
      () => normalizeLandingConfig({ gallery_images: ['/local.jpg'] }),
      LandingValidationError
    );
  });

  it('limita banners e imágenes', () => {
    const banners = Array.from({ length: 6 }, (_, index) => ({
      id: `banner-${index}`,
      title: `Banner ${index}`,
      image_url: 'https://cdn.example.com/banner.jpg'
    }));

    assert.throws(() => normalizeLandingConfig({ banners }), LandingValidationError);
    assert.throws(
      () => normalizeLandingConfig({ gallery_images: Array.from({ length: 5 }, () => 'https://cdn.example.com/x.jpg') }),
      LandingValidationError
    );
    assert.throws(
      () => normalizeLandingConfig({ about_images: Array.from({ length: 5 }, () => 'https://cdn.example.com/x.jpg') }),
      LandingValidationError
    );
  });

  it('rechaza un WhatsApp inválido', () => {
    assert.throws(
      () => normalizeLandingConfig({ whatsapp_contact: 'abc' }),
      LandingValidationError
    );
  });

  it('ignora claves de secciones desconocidas', () => {
    const config = normalizeLandingConfig({ sections_visibility: { categories: true, hacked: true } });
    assert.equal(config.sections_visibility.categories, true);
    assert.equal(config.sections_visibility.hacked, undefined);
  });
});
