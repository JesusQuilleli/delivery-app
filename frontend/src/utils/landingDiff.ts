export interface LandingChange {
  field: string;
  label: string;
  before: string;
  after: string;
}

const FIELD_LABELS: Record<string, string> = {
  layout_variant: 'Diseño de la tienda (Layout)',
  slogan: 'Eslogan',
  subtitle: 'Subtítulo',
  badge_promo: 'Badge de promoción',
  badge_delivery_time: 'Badge de entrega',
  hero_image_url: 'Imagen de portada',
  whatsapp_contact: 'WhatsApp de contacto',
  about_title: 'Título de "Sobre nosotros"',
  about_text: 'Texto de "Sobre nosotros"'
};

const LAYOUT_LABELS: Record<string, string> = {
  hero_split: 'Hero Split (Moderno Gastronómico)',
  minimal_banner: 'Banner Showcase (Marketplace Promocional)',
  grid_showcase: 'Grid Gourmet (Vitrina Directa)',
  clean_catalog: 'Boutique Elegante (Minimalista)',
  story_reel: 'Stories App (Visual Móvil)',
  magazine_editorial: 'Editorial Gourmet (Dark Mode)'
};

const SECTION_LABELS: Record<string, string> = {
  categories: 'Categorías',
  delivery_info: 'Información de delivery',
  offers: 'Ofertas',
  combos: 'Combos',
  gallery: 'Galería',
  about: 'Sobre nosotros',
  testimonials: 'Testimonios',
  contact: 'Contacto'
};

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function formatArray(field: string, value: unknown): string {
  const items = asArray(value);
  if (items.length === 0) return 'Sin elementos';

  if (field === 'banners') {
    const titles = items
      .map((item) => asObject(item).title)
      .filter((title): title is string => typeof title === 'string' && title.length > 0);
    return titles.length > 0 ? `${items.length} banner(s): ${titles.join(', ')}` : `${items.length} banner(s)`;
  }

  return `${items.length} imagen(es)`;
}

export function formatLandingValue(field: string, value: unknown): string {
  if (field === 'layout_variant' && typeof value === 'string') {
    return LAYOUT_LABELS[value] || value;
  }

  if (field === 'banners' || field === 'gallery_images' || field === 'about_images') {
    return formatArray(field, value);
  }

  if (field.startsWith('sections_visibility.')) {
    return value === false ? 'Oculta' : 'Visible';
  }

  if (value === undefined || value === null || value === '') return 'Vacío';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  return String(value);
}

function readField(config: Record<string, unknown>, field: string): unknown {
  if (!field.includes('.')) return config[field];

  return field.split('.').reduce<unknown>((value, key) => {
    const object = asObject(value);
    return object[key];
  }, config);
}

export function diffLanding(beforeValue: unknown, afterValue: unknown): LandingChange[] {
  const before = asObject(beforeValue);
  const after = asObject(afterValue);
  const fields = [
    ...Object.keys(FIELD_LABELS),
    'banners',
    'gallery_images',
    'about_images',
    ...Object.keys(SECTION_LABELS).map((key) => `sections_visibility.${key}`)
  ];

  return fields.reduce<LandingChange[]>((changes, field) => {
    const beforeField = readField(before, field);
    const afterField = readField(after, field);
    const same = JSON.stringify(beforeField ?? null) === JSON.stringify(afterField ?? null);

    if (!same) {
      const sectionKey = field.startsWith('sections_visibility.') ? field.split('.')[1] : '';
      changes.push({
        field,
        label: FIELD_LABELS[field] || SECTION_LABELS[sectionKey] || field,
        before: formatLandingValue(field, beforeField),
        after: formatLandingValue(field, afterField)
      });
    }

    return changes;
  }, []);
}

export function hasLandingChanges(beforeValue: unknown, afterValue: unknown): boolean {
  return diffLanding(beforeValue, afterValue).length > 0;
}
