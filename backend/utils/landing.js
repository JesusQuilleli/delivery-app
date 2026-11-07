const ALLOWED_SECTIONS = [
  'categories',
  'delivery_info',
  'offers',
  'combos',
  'gallery',
  'about',
  'testimonials',
  'contact'
];

const ALLOWED_LAYOUT_VARIANTS = [
  'hero_split',
  'minimal_banner',
  'grid_showcase',
  'clean_catalog',
  'story_reel',
  'magazine_editorial'
];

class LandingValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'LandingValidationError';
    this.status = 400;
  }
}

function cleanLayoutVariant(value, current = 'hero_split') {
  if (value === undefined) return current || 'hero_split';
  if (!value) return 'hero_split';
  const val = String(value).trim().toLowerCase();
  return ALLOWED_LAYOUT_VARIANTS.includes(val) ? val : 'hero_split';
}

function cleanText(value, field, maxLength) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') {
    throw new LandingValidationError(`${field} debe ser texto.`);
  }

  const text = value.trim();
  if (text.length > maxLength) {
    throw new LandingValidationError(`${field} supera el máximo de ${maxLength} caracteres.`);
  }
  if (/<[^>]*>|javascript:/i.test(text)) {
    throw new LandingValidationError(`${field} contiene contenido no permitido.`);
  }

  return text || null;
}

function cleanUrl(value, field) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;

  const url = String(value).trim();
  if (url.length > 500) {
    throw new LandingValidationError(`${field} supera el máximo de 500 caracteres.`);
  }
  if (!/^https:\/\//i.test(url)) {
    throw new LandingValidationError(`${field} debe iniciar con https://.`);
  }

  return url;
}

function cleanPhone(value, field) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;

  const phone = String(value).trim();
  if (!/^[+0-9\s()-]{7,30}$/.test(phone)) {
    throw new LandingValidationError(`${field} no tiene un formato válido.`);
  }

  return phone;
}

function cleanBoolean(value, field) {
  if (typeof value !== 'boolean') {
    throw new LandingValidationError(`${field} debe ser verdadero o falso.`);
  }
  return value;
}

function normalizeSections(value, current = {}) {
  if (value === undefined) return undefined;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new LandingValidationError('sections_visibility debe ser un objeto.');
  }

  const sections = { ...current };
  for (const key of ALLOWED_SECTIONS) {
    if (value[key] !== undefined) {
      sections[key] = cleanBoolean(value[key], `sections_visibility.${key}`);
    }
  }
  return sections;
}

function normalizeBanners(value) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    throw new LandingValidationError('banners debe ser una lista.');
  }
  if (value.length > 5) {
    throw new LandingValidationError('Solo se permiten hasta 5 banners.');
  }

  return value.map((banner, index) => {
    if (!banner || typeof banner !== 'object' || Array.isArray(banner)) {
      throw new LandingValidationError(`banners[${index}] debe ser un objeto.`);
    }

    const title = cleanText(banner.title, `banners[${index}].title`, 100) || '';
    const subtitle = cleanText(banner.subtitle, `banners[${index}].subtitle`, 180);
    const image_url = cleanUrl(banner.image_url, `banners[${index}].image_url`) || '';
    const link_url = cleanUrl(banner.link_url, `banners[${index}].link_url`);
    const id = cleanText(banner.id, `banners[${index}].id`, 60) || `banner-${index + 1}`;

    if (!title && !image_url) {
      throw new LandingValidationError(`banners[${index}] necesita un título o una imagen.`);
    }

    return { id, title, subtitle, image_url, link_url };
  });
}

function normalizeImageList(value, field, maxItems) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    throw new LandingValidationError(`${field} debe ser una lista.`);
  }
  if (value.length > maxItems) {
    throw new LandingValidationError(`${field} permite hasta ${maxItems} imágenes.`);
  }
  return value.map((image, index) => cleanUrl(image, `${field}[${index}]`)).filter(Boolean);
}

function normalizeLandingConfig(value, current = {}) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new LandingValidationError('landing_config debe ser un objeto.');
  }

  const next = {
    layout_variant: cleanLayoutVariant(value.layout_variant, current.layout_variant),
    slogan: value.slogan === undefined ? (current.slogan ?? null) : cleanText(value.slogan, 'slogan', 120),
    subtitle: value.subtitle === undefined ? (current.subtitle ?? null) : cleanText(value.subtitle, 'subtitle', 240),
    badge_promo: value.badge_promo === undefined ? (current.badge_promo ?? null) : cleanText(value.badge_promo, 'badge_promo', 60),
    badge_delivery_time: value.badge_delivery_time === undefined
      ? (current.badge_delivery_time ?? null)
      : cleanText(value.badge_delivery_time, 'badge_delivery_time', 60),
    hero_image_url: value.hero_image_url === undefined ? (current.hero_image_url ?? null) : cleanUrl(value.hero_image_url, 'hero_image_url'),
    whatsapp_contact: value.whatsapp_contact === undefined
      ? (current.whatsapp_contact ?? null)
      : cleanPhone(value.whatsapp_contact, 'whatsapp_contact'),
    about_title: value.about_title === undefined ? (current.about_title ?? null) : cleanText(value.about_title, 'about_title', 100),
    about_text: value.about_text === undefined ? (current.about_text ?? null) : cleanText(value.about_text, 'about_text', 1000),
    about_images: value.about_images === undefined ? (current.about_images ?? []) : normalizeImageList(value.about_images, 'about_images', 4),
    banners: value.banners === undefined ? (current.banners ?? []) : normalizeBanners(value.banners),
    gallery_images: value.gallery_images === undefined ? (current.gallery_images ?? []) : normalizeImageList(value.gallery_images, 'gallery_images', 4),
    sections_visibility: value.sections_visibility === undefined
      ? (current.sections_visibility ?? {})
      : normalizeSections(value.sections_visibility, current.sections_visibility || {})
  };

  return next;
}

module.exports = {
  ALLOWED_SECTIONS,
  ALLOWED_LAYOUT_VARIANTS,
  LandingValidationError,
  normalizeLandingConfig
};
