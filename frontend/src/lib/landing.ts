export type LandingLayoutVariant =
  | 'hero_split'
  | 'minimal_banner'
  | 'grid_showcase'
  | 'clean_catalog'
  | 'story_reel'
  | 'magazine_editorial';

export interface LandingBanner {
  id: string;
  image_url: string;
  title: string;
  subtitle?: string | null;
  link_url?: string | null;
}

export interface LandingSections {
  categories?: boolean;
  delivery_info?: boolean;
  offers?: boolean;
  combos?: boolean;
  gallery?: boolean;
  about?: boolean;
  testimonials?: boolean;
  contact?: boolean;
}

export interface LandingConfig {
  layout_variant?: LandingLayoutVariant | string;
  slogan?: string | null;
  subtitle?: string | null;
  badge_promo?: string | null;
  badge_delivery_time?: string | null;
  hero_image_url?: string | null;
  whatsapp_contact?: string | null;
  about_title?: string | null;
  about_text?: string | null;
  about_images?: string[];
  banners?: LandingBanner[];
  gallery_images?: string[];
  sections_visibility?: LandingSections;
}

export const LANDING_SECTION_OPTIONS: { key: keyof LandingSections; label: string; description: string }[] = [
  { key: 'categories', label: 'Categorías', description: 'Accesos directos a las categorías del catálogo.' },
  { key: 'offers', label: 'Ofertas', description: 'Productos destacados o con descuento.' },
  { key: 'combos', label: 'Combos', description: 'Paquetes y promociones agrupadas.' },
  { key: 'delivery_info', label: 'Información de delivery', description: 'Zonas, tarifas y cobertura.' },
  { key: 'gallery', label: 'Galería', description: 'Fotos del local o de los productos.' },
  { key: 'about', label: 'Sobre nosotros', description: 'Historia y datos del negocio.' },
  { key: 'testimonials', label: 'Testimonios', description: 'Reseñas reales cargadas manualmente.' },
  { key: 'contact', label: 'Contacto', description: 'WhatsApp, ubicación y formulario.' }
];

export interface LandingLayoutOption {
  value: LandingLayoutVariant;
  label: string;
  description: string;
  badge: string;
  icon: string;
  minPlan: 'EMPRENDEDOR' | 'NEGOCIO' | 'PRO';
  minPlanLabel: string;
}

export const LANDING_LAYOUT_OPTIONS: LandingLayoutOption[] = [
  {
    value: 'hero_split',
    label: 'Hero Split (Moderno Gastronómico)',
    description: 'Titular de impacto y plato estrella flotante con halo dinámico. Estilo restaurante moderno.',
    badge: 'Incluido en todos',
    icon: '🍔',
    minPlan: 'EMPRENDEDOR',
    minPlanLabel: 'Plan Emprendedor'
  },
  {
    value: 'minimal_banner',
    label: 'Banner Showcase (Marketplace Promocional)',
    description: 'Gran banner ancho panorámico con buscador rápido y franja de ofertas destacadas en cuadrícula.',
    badge: 'Plan Negocio',
    icon: '🛵',
    minPlan: 'NEGOCIO',
    minPlanLabel: 'Plan Negocio'
  },
  {
    value: 'grid_showcase',
    label: 'Grid Gourmet (Vitrina Directa)',
    description: 'Enfoque directo en combos y productos más pedidos con insignias de ahorro y banners intercalados.',
    badge: 'Plan Negocio',
    icon: '🍱',
    minPlan: 'NEGOCIO',
    minPlanLabel: 'Plan Negocio'
  },
  {
    value: 'clean_catalog',
    label: 'Boutique Elegante (Minimalista)',
    description: 'Diseño sobrio y refinado con tipografía moderna, navegación limpia por pestañas y tarjetas despejadas.',
    badge: 'Corporativo',
    icon: '✨',
    minPlan: 'PRO',
    minPlanLabel: 'Plan Corporativo'
  },
  {
    value: 'story_reel',
    label: 'Stories App (Visual Móvil)',
    description: 'Barra superior interactiva de burbujas circulares estilo Instagram Stories para ofertas del día y combos.',
    badge: 'Corporativo',
    icon: '📱',
    minPlan: 'PRO',
    minPlanLabel: 'Plan Corporativo'
  },
  {
    value: 'magazine_editorial',
    label: 'Editorial Gourmet (Dark Mode)',
    description: 'Estilo revista culinaria de lujo con contrastes visuales de alto impacto y vitrina fotográfica a sangre.',
    badge: 'Corporativo',
    icon: '🥂',
    minPlan: 'PRO',
    minPlanLabel: 'Plan Corporativo'
  }
];

export const DEFAULT_LANDING_CONFIG: LandingConfig = {
  layout_variant: 'hero_split',
  slogan: '',
  subtitle: '',
  badge_promo: '',
  badge_delivery_time: '',
  hero_image_url: '',
  whatsapp_contact: '',
  about_title: '',
  about_text: '',
  about_images: [],
  banners: [],
  gallery_images: [],
  sections_visibility: {
    categories: true,
    delivery_info: true,
    offers: true,
    combos: true,
    gallery: true,
    about: false,
    testimonials: false,
    contact: true
  }
};

export function normalizeLandingDraft(config?: LandingConfig | null): LandingConfig {
  return {
    ...DEFAULT_LANDING_CONFIG,
    ...(config || {}),
    layout_variant: config?.layout_variant || 'hero_split',
    banners: Array.isArray(config?.banners) ? config.banners : [],
    gallery_images: Array.isArray(config?.gallery_images) ? config.gallery_images : [],
    about_images: Array.isArray(config?.about_images) ? config.about_images : [],
    sections_visibility: {
      ...DEFAULT_LANDING_CONFIG.sections_visibility,
      ...(config?.sections_visibility || {})
    }
  };
}
