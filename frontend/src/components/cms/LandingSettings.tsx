import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import {
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Columns,
  Edit3,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  LayoutTemplate,
  Loader2,
  Monitor,
  Palette,
  Plus,
  Save,
  Smartphone,
  Tablet,
  Trash2,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  DEFAULT_LANDING_CONFIG,
  LANDING_SECTION_OPTIONS,
  LANDING_LAYOUT_OPTIONS,
  normalizeLandingDraft,
  type LandingBanner,
  type LandingConfig,
  type LandingSections
} from '@/lib/landing';
import { THEME_OPTIONS, resolveThemeValue } from '@/lib/themes';
import { diffLanding } from '@/utils/landingDiff';
import { CmsStepper } from './CmsStepper';
import { ChangeSummary } from './ChangeSummary';
import { LandingPreview, type PreviewMode } from './LandingPreview';
import type { PreviewDevice } from './PreviewFrame';

const CMS_STEPS = [
  { id: 'brand', label: 'Diseño y color' },
  { id: 'hero', label: 'Portada' },
  { id: 'sections', label: 'Secciones' },
  { id: 'banners', label: 'Banners' },
  { id: 'gallery', label: 'Galería' },
  { id: 'review', label: 'Revisar y publicar' }
];

interface CatalogCategory {
  id: number;
  name: string;
}

interface CatalogProduct {
  id: number;
  is_combo?: boolean;
}

function themeLabel(value: string) {
  const normalized = resolveThemeValue(value);
  return THEME_OPTIONS.find((option) => option.value === normalized)?.label || value;
}

export function LandingSettings({ slug }: { slug: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [store, setStore] = useState<Record<string, any> | null>(null);
  const [savedConfig, setSavedConfig] = useState<LandingConfig>(DEFAULT_LANDING_CONFIG);
  const [draftConfig, setDraftConfig] = useState<LandingConfig>(DEFAULT_LANDING_CONFIG);
  const [savedTheme, setSavedTheme] = useState('blue');
  const [draftTheme, setDraftTheme] = useState('blue');
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [offers, setOffers] = useState<CatalogProduct[]>([]);
  const [combos, setCombos] = useState<CatalogProduct[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('draft');
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [viewLayout, setViewLayout] = useState<'split' | 'editor' | 'preview'>('split');
  const [bannerForm, setBannerForm] = useState({ title: '', subtitle: '', link_url: '', image_url: '' });

  const draftKey = `tiendafast:landing-draft:${slug}`;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/stores/${slug}/products?limit=12`);
        if (cancelled) return;

        const storeData = res.data.store;
        const config = normalizeLandingDraft(storeData.landing_config);
        const theme = storeData.theme_color || 'blue';

        let nextConfig = config;
        let nextTheme = theme;
        const stored = sessionStorage.getItem(draftKey);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            nextConfig = normalizeLandingDraft(parsed.config);
            nextTheme = parsed.themeColor || theme;
          } catch {
            sessionStorage.removeItem(draftKey);
          }
        }

        setStore(storeData);
        setSavedConfig(config);
        setDraftConfig(nextConfig);
        setSavedTheme(theme);
        setDraftTheme(nextTheme);
        setCategories(Array.isArray(res.data.categories) ? res.data.categories.slice(0, 6) : []);

        const products: CatalogProduct[] = Array.isArray(res.data.products) ? res.data.products : [];
        setCombos(products.filter((product) => product.is_combo));
        setOffers(products.filter((product) => !product.is_combo).slice(0, 4));
      } catch (error) {
        console.error('Error cargando editor de landing', error);
        toast.error('No se pudo cargar el editor de la landing');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (slug) load();
    return () => {
      cancelled = true;
    };
  }, [slug, draftKey]);

  const changes = useMemo(() => {
    const list = diffLanding(savedConfig, draftConfig);
    if (draftTheme !== savedTheme) {
      list.unshift({
        field: 'theme_color',
        label: 'Color principal',
        before: themeLabel(savedTheme),
        after: themeLabel(draftTheme)
      });
    }
    return list;
  }, [savedConfig, draftConfig, savedTheme, draftTheme]);

  const dirty = changes.length > 0;

  useEffect(() => {
    if (loading) return;
    if (dirty) {
      sessionStorage.setItem(draftKey, JSON.stringify({ config: draftConfig, themeColor: draftTheme }));
    } else {
      sessionStorage.removeItem(draftKey);
    }
  }, [dirty, draftConfig, draftTheme, draftKey, loading]);

  useEffect(() => {
    if (!dirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirty]);

  const updateConfig = (patch: Partial<LandingConfig>) => {
    setDraftConfig((prev) => ({ ...prev, ...patch }));
  };

  const toggleSection = (key: keyof LandingSections) => {
    setDraftConfig((prev) => ({
      ...prev,
      sections_visibility: {
        ...prev.sections_visibility,
        [key]: !(prev.sections_visibility?.[key] ?? false)
      }
    }));
  };

  const goToStep = (nextIndex: number) => {
    const safeIndex = Math.max(0, Math.min(CMS_STEPS.length - 1, nextIndex));
    setStepIndex(safeIndex);
    if (safeIndex === CMS_STEPS.length - 1) setPreviewMode('compare');
  };

  const uploadImage = async (file: File, field: string, onUploaded: (url: string) => void) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen supera los 5 MB');
      return;
    }

    setUploadingField(field);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onUploaded(res.data.imageUrl);
      toast.success('Imagen cargada');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al subir la imagen');
    } finally {
      setUploadingField(null);
    }
  };

  const handleAddBanner = () => {
    if (!bannerForm.title && !bannerForm.image_url) {
      toast.error('Indica al menos un título o una imagen para el banner');
      return;
    }

    const banner: LandingBanner = {
      id: `banner-${Date.now()}`,
      title: bannerForm.title,
      subtitle: bannerForm.subtitle,
      link_url: bannerForm.link_url,
      image_url: bannerForm.image_url
    };

    setDraftConfig((prev) => ({
      ...prev,
      banners: [...(prev.banners || []), banner]
    }));
    setBannerForm({ title: '', subtitle: '', link_url: '', image_url: '' });
    toast.success('Banner agregado');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put(`/stores/${slug}/landing`, {
        landing_config: normalizeLandingDraft(draftConfig),
        theme_color: draftTheme
      });
      const nextConfig = normalizeLandingDraft(res.data.landing_config);
      const nextTheme = res.data.theme_color || draftTheme;
      setSavedConfig(nextConfig);
      setDraftConfig(nextConfig);
      setSavedTheme(nextTheme);
      setDraftTheme(nextTheme);
      sessionStorage.removeItem(draftKey);
      toast.success('Landing publicada correctamente');
      setPreviewMode('current');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'No se pudo publicar la landing');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setDraftConfig(savedConfig);
    setDraftTheme(savedTheme);
    sessionStorage.removeItem(draftKey);
    toast.success('Cambios descartados');
  };

  const renderStep = () => {
    if (stepIndex === 0) {
      return (
        <div className="space-y-6">
          {/* Selector de Diseño Web (3 Layouts) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-gray-900">
                <LayoutTemplate size={16} className="text-primary" /> Diseño de Tienda (3 Layouts)
              </h3>
              <span className="text-[10px] font-black text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                Multidiseño CMS
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Elige cómo estructurar la portada, los banners promocionales y la vitrina de productos de tu tienda.
            </p>

            <div className="grid grid-cols-1 gap-2.5">
              {LANDING_LAYOUT_OPTIONS.map((layout) => {
                const active = (draftConfig.layout_variant || 'hero_split') === layout.value;
                return (
                  <button
                    key={layout.value}
                    type="button"
                    onClick={() => updateConfig({ layout_variant: layout.value })}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                      active
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/30 shadow-xs'
                        : 'border-border hover:bg-muted/30'
                    }`}
                  >
                    <span className="text-2xl p-2 bg-white rounded-xl shadow-xs border border-border shrink-0">
                      {layout.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-black text-xs text-gray-950">{layout.label}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                          {layout.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 font-medium mt-1 leading-snug">{layout.description}</p>
                    </div>
                    {active && <Check className="h-4 w-4 shrink-0 text-primary mt-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-gray-900">
              <Palette size={16} className="text-primary" /> Color Principal de la Marca
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Este color se aplica instantáneamente a botones, halos, banners, badges y acentos de tu landing.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {THEME_OPTIONS.map((option) => {
              const active = resolveThemeValue(draftTheme) === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDraftTheme(option.value)}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                    active ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:bg-muted/30'
                  }`}
                >
                  <span
                    className="h-8 w-8 shrink-0 rounded-full border border-black/10 shadow-sm"
                    style={{ backgroundColor: `oklch(${option.primary})` }}
                  />
                  <span className="min-w-0">
                    <span className="block text-xs font-bold">{option.label}</span>
                    <span className="block text-[10px] text-muted-foreground">{option.value}</span>
                  </span>
                  {active && <Check className="ml-auto h-4 w-4 shrink-0 text-primary" />}
                </button>
              );
            })}
          </div>

          <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-4">
            <label htmlFor="whatsapp_contact" className="text-xs font-bold uppercase text-muted-foreground">
              WhatsApp de contacto
            </label>
            <Input
              id="whatsapp_contact"
              value={draftConfig.whatsapp_contact || ''}
              onChange={(event) => updateConfig({ whatsapp_contact: event.target.value })}
              placeholder="+58 412 000 0000"
              className="border-border bg-background"
            />
            <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
              <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Se usa en el botón flotante, la sección de contacto y el formulario. Sin este dato, esas secciones no se muestran.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-background p-4 text-xs text-muted-foreground">
            <div className="font-bold text-foreground">{store?.name || 'Tu negocio'}</div>
            <div className="mt-1">
              Industria: {store?.industry === 'RESTAURANT' ? 'Restaurante' : store?.industry === 'SUPERMARKET' ? 'Supermercado' : 'Farmacia'}
            </div>
            <div>Enlace público: /{store?.slug || slug}</div>
          </div>
        </div>
      );
    }

    if (stepIndex === 1) {
      return (
        <div className="space-y-5">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider">
              <ImageIcon size={16} className="text-primary" /> Portada
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">Personaliza el primer bloque que verán tus clientes.</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="slogan" className="text-xs font-bold uppercase text-muted-foreground">Eslogan / título principal</label>
            <Input
              id="slogan"
              value={draftConfig.slogan || ''}
              onChange={(event) => updateConfig({ slogan: event.target.value })}
              placeholder="El sabor que amas, directo a tu mesa"
              className="border-border bg-background"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="subtitle" className="text-xs font-bold uppercase text-muted-foreground">Subtítulo descriptivo</label>
            <textarea
              id="subtitle"
              value={draftConfig.subtitle || ''}
              onChange={(event) => updateConfig({ subtitle: event.target.value })}
              rows={3}
              placeholder="Explica qué ofreces y por qué elegirte."
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="badge_promo" className="text-xs font-bold uppercase text-muted-foreground">Badge promocional</label>
              <Input
                id="badge_promo"
                value={draftConfig.badge_promo || ''}
                onChange={(event) => updateConfig({ badge_promo: event.target.value })}
                placeholder="Delivery activo"
                className="border-border bg-background"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="badge_delivery_time" className="text-xs font-bold uppercase text-muted-foreground">Badge de entrega</label>
              <Input
                id="badge_delivery_time"
                value={draftConfig.badge_delivery_time || ''}
                onChange={(event) => updateConfig({ badge_delivery_time: event.target.value })}
                placeholder="Entrega rápida"
                className="border-border bg-background"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">Imagen de portada</label>
            <div className="flex flex-wrap items-center gap-3">
              <Input
                type="file"
                accept="image/*"
                disabled={uploadingField === 'hero'}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  const file = event.target.files?.[0];
                  if (file) uploadImage(file, 'hero', (url) => updateConfig({ hero_image_url: url }));
                }}
                className="max-w-sm border-border bg-background file:rounded-lg file:border-0 file:bg-primary/10 file:font-semibold file:text-primary"
              />
              {uploadingField === 'hero' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            </div>
            {draftConfig.hero_image_url && (
              <img
                src={draftConfig.hero_image_url}
                alt="Portada de la landing"
                className="mt-2 h-32 w-full max-w-md rounded-2xl border border-border object-cover"
              />
            )}
          </div>
        </div>
      );
    }

    if (stepIndex === 2) {
      return (
        <div className="space-y-5">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider">
              <LayoutTemplate size={16} className="text-primary" /> Secciones y contenido
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">Activa solo lo que tu negocio puede mostrar con datos reales.</p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {LANDING_SECTION_OPTIONS.map((section) => {
              const active = draftConfig.sections_visibility?.[section.key] === true;
              return (
                <button
                  key={section.key}
                  type="button"
                  onClick={() => toggleSection(section.key)}
                  className={`rounded-xl border p-3 text-left transition ${
                    active ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted/40'
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold">{section.label}</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                      active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      {active ? 'ON' : 'OFF'}
                    </span>
                  </span>
                  <span className="mt-1 block text-[10px] leading-snug opacity-80">{section.description}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-3 rounded-2xl border border-border bg-muted/10 p-4">
            <div className="text-xs font-bold uppercase text-muted-foreground">Sobre nosotros</div>
            <div className="space-y-2">
              <label htmlFor="about_title" className="text-xs font-bold uppercase text-muted-foreground">Título</label>
              <Input
                id="about_title"
                value={draftConfig.about_title || ''}
                onChange={(event) => updateConfig({ about_title: event.target.value })}
                placeholder="Nuestra historia"
                className="border-border bg-background"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="about_text" className="text-xs font-bold uppercase text-muted-foreground">Texto</label>
              <textarea
                id="about_text"
                value={draftConfig.about_text || ''}
                onChange={(event) => updateConfig({ about_text: event.target.value })}
                rows={4}
                placeholder="Cuenta quién eres, cuánto tiempo llevas y qué te hace diferente."
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Fotos de "Sobre nosotros" ({(draftConfig.about_images || []).length}/4)</label>
              {(draftConfig.about_images || []).length < 4 && (
                <div className="flex flex-wrap items-center gap-3">
                  <Input
                    type="file"
                    accept="image/*"
                    disabled={uploadingField === 'about'}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        uploadImage(file, 'about', (url) => {
                          setDraftConfig((prev) => ({
                            ...prev,
                            about_images: [...(prev.about_images || []), url]
                          }));
                        });
                      }
                    }}
                    className="max-w-sm border-border bg-background file:rounded-lg file:border-0 file:bg-primary/10 file:font-semibold file:text-primary"
                  />
                  {uploadingField === 'about' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                </div>
              )}
              {(draftConfig.about_images || []).length > 0 && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(draftConfig.about_images || []).map((image, index) => (
                    <div key={`${image}-${index}`} className="group relative h-24 overflow-hidden rounded-xl border border-border bg-muted">
                      <img src={image} alt={`Sobre nosotros ${index + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setDraftConfig((prev) => ({
                            ...prev,
                            about_images: (prev.about_images || []).filter((_, imageIndex) => imageIndex !== index)
                          }));
                        }}
                        className="absolute right-1.5 top-1.5 rounded-full bg-red-600 p-1 text-white opacity-0 transition group-hover:opacity-100"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (stepIndex === 3) {
      const banners = draftConfig.banners || [];
      return (
        <div className="space-y-5">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider">
              <ImageIcon size={16} className="text-primary" /> Banners promocionales
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">Hasta 5 anuncios destacados. Los enlaces deben iniciar con https://.</p>
          </div>

          {banners.length < 5 && (
            <div className="space-y-3 rounded-2xl border border-dashed border-border bg-muted/10 p-4">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Input
                  value={bannerForm.title}
                  onChange={(event) => setBannerForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Título del banner"
                  className="border-border bg-background text-xs"
                />
                <Input
                  value={bannerForm.subtitle}
                  onChange={(event) => setBannerForm((prev) => ({ ...prev, subtitle: event.target.value }))}
                  placeholder="Subtítulo opcional"
                  className="border-border bg-background text-xs"
                />
              </div>
              <Input
                value={bannerForm.link_url}
                onChange={(event) => setBannerForm((prev) => ({ ...prev, link_url: event.target.value }))}
                placeholder="https://... (opcional)"
                className="border-border bg-background text-xs"
              />
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  type="file"
                  accept="image/*"
                  disabled={uploadingField === 'banner'}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    const file = event.target.files?.[0];
                    if (file) uploadImage(file, 'banner', (url) => setBannerForm((prev) => ({ ...prev, image_url: url })));
                  }}
                  className="max-w-sm border-border bg-background text-xs file:rounded-lg file:border-0 file:bg-primary/10 file:font-semibold file:text-primary"
                />
                {uploadingField === 'banner' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                {bannerForm.image_url && <img src={bannerForm.image_url} alt="Vista previa del banner" className="h-10 w-16 rounded-lg border border-border object-cover" />}
              </div>
              <div className="flex justify-end">
                <Button type="button" size="sm" onClick={handleAddBanner} className="font-bold">
                  <Plus size={14} className="mr-1" /> Añadir banner
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {banners.length === 0 && <p className="text-xs text-muted-foreground">Todavía no hay banners.</p>}
            {banners.map((banner) => (
              <div key={banner.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
                {banner.image_url ? (
                  <img src={banner.image_url} alt={banner.title} className="h-12 w-16 shrink-0 rounded-lg border border-border object-cover" />
                ) : (
                  <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <ImageIcon size={18} className="text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-bold">{banner.title || 'Banner sin título'}</div>
                  {banner.subtitle && <div className="truncate text-[11px] text-muted-foreground">{banner.subtitle}</div>}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setDraftConfig((prev) => ({
                      ...prev,
                      banners: (prev.banners || []).filter((item) => item.id !== banner.id)
                    }));
                  }}
                  className="h-8 w-8 shrink-0 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (stepIndex === 4) {
      const images = draftConfig.gallery_images || [];
      return (
        <div className="space-y-5">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider">
              <Camera size={16} className="text-primary" /> Galería del local
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">Hasta 4 fotos de la fachada, el equipo o los productos.</p>
          </div>

          {images.length < 4 && (
            <div className="flex flex-wrap items-center gap-3">
              <Input
                type="file"
                accept="image/*"
                disabled={uploadingField === 'gallery'}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    uploadImage(file, 'gallery', (url) => {
                      setDraftConfig((prev) => ({
                        ...prev,
                        gallery_images: [...(prev.gallery_images || []), url]
                      }));
                    });
                  }
                }}
                className="max-w-sm border-border bg-background text-xs file:rounded-lg file:border-0 file:bg-primary/10 file:font-semibold file:text-primary"
              />
              {uploadingField === 'gallery' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            </div>
          )}

          {images.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {images.map((image, index) => (
                <div key={`${image}-${index}`} className="group relative h-28 overflow-hidden rounded-xl border border-border bg-muted shadow-sm">
                  <img src={image} alt={`Foto del local ${index + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setDraftConfig((prev) => ({
                        ...prev,
                        gallery_images: (prev.gallery_images || []).filter((_, imageIndex) => imageIndex !== index)
                      }));
                    }}
                    className="absolute right-2 top-2 rounded-full bg-red-600 p-1.5 text-white opacity-0 transition group-hover:opacity-100"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
              Aún no has subido fotos del local.
            </div>
          )}
        </div>
      );
    }

    const checklist = [
      { label: 'Nombre del negocio configurado', done: Boolean(store?.name) },
      { label: 'Eslogan o título de portada', done: Boolean(draftConfig.slogan) },
      { label: 'WhatsApp de contacto', done: Boolean(draftConfig.whatsapp_contact) },
      { label: 'Imagen de portada', done: Boolean(draftConfig.hero_image_url) },
      { label: 'Sección de contacto activa', done: Boolean(draftConfig.sections_visibility?.contact) }
    ];

    return (
      <div className="space-y-5">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider">
            <Save size={16} className="text-primary" /> Revisar y publicar
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">Compara la versión actual con tus cambios antes de publicar.</p>
        </div>

        <div className="space-y-2 rounded-2xl border border-border bg-muted/10 p-4">
          {checklist.map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-xs">
              <span className={`grid h-5 w-5 place-items-center rounded-full ${item.done ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {item.done ? <Check size={12} /> : <CircleAlert size={12} />}
              </span>
              <span className={item.done ? 'font-semibold' : 'text-muted-foreground'}>{item.label}</span>
            </div>
          ))}
        </div>

        <ChangeSummary changes={changes} saving={saving} onDiscard={handleDiscard} onPublish={handleSave} />
      </div>
    );
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <LayoutTemplate className="text-primary" /> Diseño y landing
              {dirty && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase text-amber-700">
                  Sin publicar
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Edita por pasos, revisa el resultado en vivo y publica solo cuando estés conforme.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl bg-muted p-1 border">
              <button
                type="button"
                onClick={() => setViewLayout('split')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${viewLayout === 'split' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Columns size={14} /> <span className="hidden sm:inline">Dividida</span>
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('editor')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${viewLayout === 'editor' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Edit3 size={14} /> <span className="hidden sm:inline">Solo Editor</span>
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${viewLayout === 'preview' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Eye size={14} /> <span className="hidden sm:inline">Solo Vista Previa</span>
              </button>
            </div>
            <a
              href={`/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-primary/30 px-4 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/10"
            >
              <ExternalLink size={14} /> Ver landing en vivo
            </a>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : (
          <div className={
            viewLayout === 'editor'
              ? 'max-w-4xl mx-auto space-y-6'
              : viewLayout === 'preview'
              ? 'max-w-7xl mx-auto space-y-6'
              : 'grid grid-cols-1 gap-6 xl:grid-cols-[480px_minmax(0,1fr)] 2xl:grid-cols-[520px_minmax(0,1fr)] items-start'
          }>
            <div className={`min-w-0 space-y-4 ${viewLayout === 'preview' ? 'hidden' : 'block'}`}>
              <CmsStepper steps={CMS_STEPS} activeIndex={stepIndex} onSelect={goToStep} />

              <div className="min-h-[470px] rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
                {renderStep()}
              </div>

              <div className="flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={stepIndex === 0}
                  onClick={() => goToStep(stepIndex - 1)}
                  className="font-bold"
                >
                  <ChevronLeft size={16} className="mr-1" /> Anterior
                </Button>
                {stepIndex < CMS_STEPS.length - 1 ? (
                  <Button type="button" onClick={() => goToStep(stepIndex + 1)} className="font-bold">
                    Siguiente <ChevronRight size={16} className="ml-1" />
                  </Button>
                ) : (
                  <Button type="button" onClick={handleSave} disabled={saving || !dirty} className="font-bold">
                    {saving ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
                    Publicar cambios
                  </Button>
                )}
              </div>
            </div>

            <div className={`min-w-0 space-y-3 self-start xl:sticky xl:top-6 ${viewLayout === 'editor' ? 'hidden' : 'block'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm">
                <div className="flex rounded-xl bg-muted p-1">
                  {([
                    { id: 'current', label: 'Ahora' },
                    { id: 'draft', label: 'Con cambios' },
                    { id: 'compare', label: 'Comparar' }
                  ] as const).map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setPreviewMode(option.id)}
                      className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
                        previewMode === option.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1">
                  <div className="flex rounded-xl bg-muted p-1">
                    {([
                      { id: 'desktop', icon: Monitor, label: 'Escritorio' },
                      { id: 'tablet', icon: Tablet, label: 'Tablet' },
                      { id: 'mobile', icon: Smartphone, label: 'Móvil' }
                    ] as const).map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          title={option.label}
                          aria-label={option.label}
                          onClick={() => setDevice(option.id)}
                          className={`rounded-lg p-1.5 transition ${
                            device === option.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                          }`}
                        >
                          <Icon size={15} />
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobilePreviewOpen(true)}
                    className="flex items-center gap-1 rounded-xl bg-foreground px-2.5 py-2 text-[11px] font-bold text-background xl:hidden"
                  >
                    <Eye size={14} /> Vista previa
                  </button>
                </div>
              </div>

              {previewMode === 'compare' ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                    <Eye size={14} /> Comparación lado a lado
                  </div>
                  <LandingPreview
                    store={store}
                    currentConfig={savedConfig}
                    draftConfig={draftConfig}
                    currentTheme={savedTheme}
                    draftTheme={draftTheme}
                    mode={previewMode}
                    device={device}
                    categories={categories}
                    offers={offers}
                    combos={combos}
                  />
                </div>
              ) : (
                <LandingPreview
                  store={store}
                  currentConfig={savedConfig}
                  draftConfig={draftConfig}
                  currentTheme={savedTheme}
                  draftTheme={draftTheme}
                  mode={previewMode}
                  device={device}
                  categories={categories}
                  offers={offers}
                  combos={combos}
                />
              )}

              {dirty && (
                <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800">
                  <span>Tienes cambios sin publicar.</span>
                  <button type="button" onClick={handleDiscard} className="underline">
                    Descartar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {mobilePreviewOpen && (
          <div className="fixed inset-0 z-[80] flex flex-col bg-background p-3 sm:p-4 xl:hidden">
            <div className="flex items-center justify-between pb-2">
              <div>
                <div className="text-sm font-black">Vista previa</div>
                <div className="text-[11px] text-muted-foreground">Cambios sin publicar incluidos</div>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setMobilePreviewOpen(false)}>
                <X size={18} />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <LandingPreview
                store={store}
                currentConfig={savedConfig}
                draftConfig={draftConfig}
                currentTheme={savedTheme}
                draftTheme={draftTheme}
                mode={previewMode === 'compare' ? 'draft' : previewMode}
                device="mobile"
                categories={categories}
                offers={offers}
                combos={combos}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
