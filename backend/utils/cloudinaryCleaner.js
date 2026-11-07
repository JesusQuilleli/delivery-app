const { cloudinary } = require('../config/cloudinary');

/**
 * Extrae de forma precisa el public_id (incluyendo la carpeta) de una URL de Cloudinary.
 * Maneja versiones (/v123456789/) y transformaciones opcionales (/c_scale,w_500/).
 */
function getPublicIdFromUrl(url) {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) {
    return null;
  }

  try {
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return null;

    // Obtener todo después de '/upload/'
    let pathAfterUpload = url.substring(uploadIndex + '/upload/'.length);

    // Omitir transformaciones y versión (ej. 'w_500,q_auto/v1680000000/delivery_app/item.webp')
    const segments = pathAfterUpload.split('/');
    
    // Filtrar segmentos de transformaciones o de versión (v1234567...)
    const cleanSegments = segments.filter(seg => !/^v[0-9]+$/.test(seg) && !seg.includes(',') && !seg.startsWith('s--'));

    if (cleanSegments.length === 0) return null;

    const fullPath = cleanSegments.join('/');
    // Remover extensión final (.jpg, .webp, .png, etc.)
    const lastDotIndex = fullPath.lastIndexOf('.');
    return lastDotIndex !== -1 ? fullPath.substring(0, lastDotIndex) : fullPath;
  } catch (error) {
    return null;
  }
}

/**
 * Elimina una imagen de Cloudinary de forma asíncrona y segura (sin romper el flujo si falla la red).
 */
async function deleteFromCloudinary(url) {
  const publicId = getPublicIdFromUrl(url);
  if (!publicId) return false;

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (err) {
    console.warn(`[CloudinaryCleaner] Error eliminando imagen (${publicId}):`, err.message);
    return false;
  }
}

/**
 * Elimina múltiples imágenes en paralelo.
 */
async function deleteMultipleFromCloudinary(urls) {
  if (!Array.isArray(urls) || urls.length === 0) return;
  const validUrls = urls.filter(Boolean);
  await Promise.allSettled(validUrls.map(url => deleteFromCloudinary(url)));
}

/**
 * Extrae todas las URLs de imágenes asociadas a una configuración de Landing Page.
 */
function extractLandingImageUrls(config) {
  if (!config || typeof config !== 'object') return [];

  const urls = new Set();

  if (config.hero_image_url) {
    urls.add(config.hero_image_url);
  }

  if (Array.isArray(config.banners)) {
    for (const b of config.banners) {
      if (b && b.image_url) urls.add(b.image_url);
    }
  }

  if (Array.isArray(config.gallery_images)) {
    for (const g of config.gallery_images) {
      if (typeof g === 'string' && g) urls.add(g);
    }
  }

  return Array.from(urls);
}

/**
 * Compara dos configuraciones de landing (anterior y nueva) y destruye en Cloudinary
 * aquellas imágenes que fueron descartadas o reemplazadas.
 */
async function cleanOrphanLandingImages(oldConfig, newConfig) {
  const oldUrls = extractLandingImageUrls(oldConfig);
  const newUrls = new Set(extractLandingImageUrls(newConfig));

  const orphanUrls = oldUrls.filter(url => !newUrls.has(url));
  if (orphanUrls.length > 0) {
    await deleteMultipleFromCloudinary(orphanUrls);
  }
  return orphanUrls;
}

module.exports = {
  getPublicIdFromUrl,
  deleteFromCloudinary,
  deleteMultipleFromCloudinary,
  extractLandingImageUrls,
  cleanOrphanLandingImages
};
