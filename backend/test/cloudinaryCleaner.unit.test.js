const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getPublicIdFromUrl,
  extractLandingImageUrls
} = require('../utils/cloudinaryCleaner');

test('Cloudinary Cleaner (Unit)', async (t) => {
  await t.test('extrae publicId correctamente de URLs estándar con versión', () => {
    const url = 'https://res.cloudinary.com/mi-cloud/image/upload/v1712345678/delivery_app/hamburguesa_doble.webp';
    const publicId = getPublicIdFromUrl(url);
    assert.equal(publicId, 'delivery_app/hamburguesa_doble');
  });

  await t.test('extrae publicId omitiendo transformaciones automáticas', () => {
    const url = 'https://res.cloudinary.com/mi-cloud/image/upload/w_500,f_auto,q_auto/v1712345678/delivery_app/banner_promo.jpg';
    const publicId = getPublicIdFromUrl(url);
    assert.equal(publicId, 'delivery_app/banner_promo');
  });

  await t.test('retorna null para URLs no pertenecientes a Cloudinary o inválidas', () => {
    assert.equal(getPublicIdFromUrl('https://images.unsplash.com/photo-123.jpg'), null);
    assert.equal(getPublicIdFromUrl(''), null);
    assert.equal(getPublicIdFromUrl(null), null);
    assert.equal(getPublicIdFromUrl(undefined), null);
  });

  await t.test('extrae todas las imágenes de una landing config (hero, banners y galería)', () => {
    const config = {
      hero_image_url: 'https://res.cloudinary.com/mi-cloud/image/upload/delivery_app/hero.webp',
      banners: [
        { id: '1', image_url: 'https://res.cloudinary.com/mi-cloud/image/upload/delivery_app/banner1.webp' },
        { id: '2', image_url: 'https://res.cloudinary.com/mi-cloud/image/upload/delivery_app/banner2.webp' },
        { id: '3', image_url: null }
      ],
      gallery_images: [
        'https://res.cloudinary.com/mi-cloud/image/upload/delivery_app/gal1.webp',
        'https://res.cloudinary.com/mi-cloud/image/upload/delivery_app/gal2.webp'
      ]
    };

    const urls = extractLandingImageUrls(config);
    assert.equal(urls.length, 5);
    assert.ok(urls.includes('https://res.cloudinary.com/mi-cloud/image/upload/delivery_app/hero.webp'));
    assert.ok(urls.includes('https://res.cloudinary.com/mi-cloud/image/upload/delivery_app/banner1.webp'));
    assert.ok(urls.includes('https://res.cloudinary.com/mi-cloud/image/upload/delivery_app/gal2.webp'));
  });

  await t.test('extrae array vacío ante configuraciones nulas o sin multimedia', () => {
    assert.deepEqual(extractLandingImageUrls(null), []);
    assert.deepEqual(extractLandingImageUrls({}), []);
    assert.deepEqual(extractLandingImageUrls({ slogan: 'Solo texto' }), []);
  });
});
