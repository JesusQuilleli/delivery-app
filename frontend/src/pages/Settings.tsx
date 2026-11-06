import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import AdminLayout from '../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Store, Bell, Shield, MapPin, Save, Loader2, DollarSign, RefreshCw, Truck, Plus, Trash2, Landmark, Volume2, LogOut, KeyRound, LayoutTemplate, ExternalLink, Image as ImageIcon, Camera, Calculator, Zap } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { type LatLngExpression } from 'leaflet';
import { toast } from 'sonner';
import { playOrderChime } from '../lib/notifications';

// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface DeliveryZone {
  id: number;
  name: string;
  min_distance_km: number;
  max_distance_km: number | null;
  fee: number;
  is_active: boolean;
}

// @ts-ignore
function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  )
}

export default function Settings() {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [storeName, setStoreName] = useState('');
  const [industry, setIndustry] = useState('PHARMACY');
  const [themeColor, setThemeColor] = useState('blue');
  const [mapPosition, setMapPosition] = useState<[number, number] | null>(null);

  const [currency, setCurrency] = useState('USD');
  const [vesRate, setVesRate] = useState(36.5);
  const [copRate, setCopRate] = useState(4000);
  const [syncing, setSyncing] = useState(false);

  const [deliveryFee, setDeliveryFee] = useState(0);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [zoneForm, setZoneForm] = useState({ name: '', min: '', max: '', fee: '' });
  const [savingZone, setSavingZone] = useState(false);
  const [testKm, setTestKm] = useState('4.5');
  const [loadingPresets, setLoadingPresets] = useState(false);

  const loadPuertoAyacuchoPresets = async () => {
    setLoadingPresets(true);
    try {
      const presets = [
        { name: 'Casco Central / Centro (0 a 3 km)', min: '0', max: '3', fee: '1.50' },
        { name: 'Zona Urbana Intermedia (3 a 6 km)', min: '3', max: '6', fee: '2.50' },
        { name: 'Zona Sur / Periferia (6 a 10 km)', min: '6', max: '10', fee: '3.50' },
        { name: 'Límite de Cobertura (10 a 14 km)', min: '10', max: '14', fee: '5.00' }
      ];
      for (const p of presets) {
        await api.post(`/stores/${slug}/delivery-zones`, {
          name: p.name,
          min_distance_km: parseFloat(p.min),
          max_distance_km: parseFloat(p.max),
          fee: parseFloat(p.fee)
        });
      }
      const res = await api.get(`/stores/${slug}/delivery-zones`);
      setZones(res.data.zones || []);
      toast.success('¡Tarifas estándar para Puerto Ayacucho cargadas con éxito!');
    } catch (e) {
      console.error(e);
      toast.error('Error al cargar zonas sugeridas');
    } finally {
      setLoadingPresets(false);
    }
  };

  const [bankName, setBankName] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [bankPhone, setBankPhone] = useState('');
  const [bankIdNumber, setBankIdNumber] = useState('');
  const [bankHolder, setBankHolder] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  // F2E-02: Configuración visual y landing
  const [landingConfig, setLandingConfig] = useState({
    slogan: '',
    subtitle: '',
    badge_promo: '',
    badge_delivery_time: '',
    hero_image_url: '',
    whatsapp_contact: '',
    sections_visibility: {
      categories: true,
      delivery_info: true,
      offers: true,
      combos: true,
      gallery: true,
      about: true,
      testimonials: true,
      contact: true
    },
    banners: [] as { id: string; image_url: string; title: string; subtitle?: string; link_url?: string }[],
    gallery_images: [] as string[]
  });

  const [newBannerTitle, setNewBannerTitle] = useState('');
  const [newBannerSubtitle, setNewBannerSubtitle] = useState('');
  const [newBannerLink, setNewBannerLink] = useState('');
  const [newBannerImage, setNewBannerImage] = useState('');
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [isUploadingHero, setIsUploadingHero] = useState(false);

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen supera los 5 MB");
      return;
    }
    setIsUploadingHero(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setLandingConfig(prev => ({ ...prev, hero_image_url: res.data.imageUrl }));
      toast.success("Banner principal cargado");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error al subir imagen");
    } finally {
      setIsUploadingHero(false);
    }
  };

  
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBanner(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setNewBannerImage(res.data.imageUrl);
      toast.success("Imagen de banner cargada");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error al subir imagen");
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleAddBanner = () => {
    if (!newBannerImage && !newBannerTitle) {
      toast.error("Indica al menos un título o imagen para el banner");
      return;
    }
    const newB = {
      id: Date.now().toString(),
      image_url: newBannerImage,
      title: newBannerTitle,
      subtitle: newBannerSubtitle,
      link_url: newBannerLink
    };
    setLandingConfig(prev => ({
      ...prev,
      banners: [...prev.banners, newB]
    }));
    setNewBannerTitle('');
    setNewBannerSubtitle('');
    setNewBannerLink('');
    setNewBannerImage('');
    toast.success("Banner agregado. Recuerda guardar cambios.");
  };

  const handleRemoveBanner = (bannerId: string) => {
    setLandingConfig(prev => ({
      ...prev,
      banners: prev.banners.filter(b => b.id !== bannerId)
    }));
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (landingConfig.gallery_images.length >= 4) {
      toast.error("Máximo 4 imágenes en la galería del local");
      return;
    }
    setIsUploadingGallery(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setLandingConfig(prev => ({
        ...prev,
        gallery_images: [...prev.gallery_images, res.data.imageUrl]
      }));
      toast.success("Foto añadida a la galería. Recuerda guardar cambios.");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error al subir foto");
    } finally {
      setIsUploadingGallery(false);
    }
  };

  const handleRemoveGalleryImage = (idxToRemove: number) => {
    setLandingConfig(prev => ({
      ...prev,
      gallery_images: prev.gallery_images.filter((_, idx) => idx !== idxToRemove)
    }));
  };

  const toggleSection = (sectionKey: string) => {
    setLandingConfig(prev => ({
      ...prev,
      sections_visibility: {
        ...prev.sections_visibility,
        [sectionKey]: !(prev.sections_visibility as any)[sectionKey]
      }
    }));
  };

  // Notificaciones y Seguridad
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await api.get(`/stores/${slug}/products`);
        if (res.data && res.data.store) {
          setStoreName(res.data.store.name);
          if (res.data.store.industry) setIndustry(res.data.store.industry);
          if (res.data.store.theme_color) setThemeColor(res.data.store.theme_color);
          if (res.data.store.latitude && res.data.store.longitude) {
            setMapPosition([res.data.store.latitude, res.data.store.longitude]);
          } else {
            setMapPosition([5.6667, -67.6333]); // Default Puerto Ayacucho
          }
          if (res.data.store.currency) setCurrency(res.data.store.currency);
          if (res.data.store.ves_rate) setVesRate(res.data.store.ves_rate);
          if (res.data.store.cop_rate) setCopRate(res.data.store.cop_rate);
          if (res.data.store.delivery_fee !== undefined) setDeliveryFee(Number(res.data.store.delivery_fee));
          if (res.data.store.landing_config) {
            const cfg = res.data.store.landing_config;
            setLandingConfig({
              slogan: cfg.slogan || '',
              subtitle: cfg.subtitle || '',
              badge_promo: cfg.badge_promo || '',
              badge_delivery_time: cfg.badge_delivery_time || '',
              hero_image_url: cfg.hero_image_url || '',
              whatsapp_contact: cfg.whatsapp_contact || '',
              sections_visibility: cfg.sections_visibility || {
                categories: true,
                delivery_info: true,
                offers: true,
                combos: true,
                gallery: true,
                about: true,
                testimonials: true,
                contact: true
              },
              banners: Array.isArray(cfg.banners) ? cfg.banners : [],
              gallery_images: Array.isArray(cfg.gallery_images) ? cfg.gallery_images : []
            });
          }
          setBankName(res.data.store.bank_name || '');
          setBankCode(res.data.store.bank_code || '');
          setBankPhone(res.data.store.bank_phone || '');
          setBankIdNumber(res.data.store.bank_id_number || '');
          setBankHolder(res.data.store.bank_holder || '');
          setPaymentNote(res.data.store.payment_note || '');
        }
      } catch (error) {
        console.error("Error cargando configuración", error);
      }

      try {
        const zonesRes = await api.get(`/stores/${slug}/delivery-zones`);
        setZones(zonesRes.data.zones || []);
      } catch (error) {
        console.error("Error cargando zonas de delivery", error);
      }

      setLoading(false);
    };
    fetchStore();
  }, [slug]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = {
        name: storeName,
        industry,
        theme_color: themeColor,
        currency,
        ves_rate: vesRate,
        cop_rate: copRate,
        delivery_fee: deliveryFee,
        bank_name: bankName,
        bank_code: bankCode,
        bank_phone: bankPhone,
        bank_id_number: bankIdNumber,
        bank_holder: bankHolder,
        payment_note: paymentNote,
        landing_config: landingConfig
      };
      if (mapPosition) {
        payload.latitude = mapPosition[0];
        payload.longitude = mapPosition[1];
      }
      await api.put(`/stores/${slug}/settings`, payload);
      toast.success('Configuración guardada exitosamente');
    } catch (error) {
      console.error("Error guardando", error);
      toast.error('Hubo un error al guardar la configuración');
    }
    setSaving(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error('Completa la contraseña actual y la nueva contraseña.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('La confirmación de la contraseña no coincide.');
      return;
    }

    setChangingPassword(true);
    try {
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      toast.success('Contraseña actualizada exitosamente.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al cambiar la contraseña.');
    }
    setChangingPassword(false);
  };

  const handleLogoutSession = async () => {
    if (!window.confirm('¿Seguro que deseas cerrar sesión?')) return;
    setLoggingOut(true);
    try {
      await api.post('/auth/logout');
      window.location.href = '/admin-login';
    } catch {
      window.location.href = '/admin-login';
    }
  };

  const syncBCV = async () => {
    if (!slug) return;
    setSyncing(true);
    try {
      const response = await api.post(`/stores/${slug}/rates/sync-bcv`);
      const rate = Number(response.data.ves_rate);
      setVesRate(rate);
      const suffix = response.data.cached ? ' (en caché)' : '';
      toast.success(`Tasa BCV sincronizada: 1 USD = ${rate} Bs.${suffix}`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || 'Error sincronizando la tasa del BCV');
    }
    setSyncing(false);
  };

  const addZone = async () => {
    if (!slug) return;
    const name = zoneForm.name.trim();
    const fee = Number(zoneForm.fee);
    const min = zoneForm.min === '' ? 0 : Number(zoneForm.min);
    const max = zoneForm.max === '' ? null : Number(zoneForm.max);

    if (!name || !Number.isFinite(fee) || fee < 0 || !Number.isFinite(min) || min < 0) {
      toast.error('Completa el nombre, la distancia mínima y una tarifa válida');
      return;
    }
    if (max !== null && (!Number.isFinite(max) || max < min)) {
      toast.error('La distancia máxima debe ser mayor o igual a la mínima');
      return;
    }

    setSavingZone(true);
    try {
      const res = await api.post(`/stores/${slug}/delivery-zones`, {
        name,
        min_distance_km: min,
        max_distance_km: max,
        fee
      });
      setZones(prev => [...prev, res.data.zone].sort((a, b) => Number(a.min_distance_km) - Number(b.min_distance_km)));
      setZoneForm({ name: '', min: '', max: '', fee: '' });
      toast.success('Zona de delivery agregada');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || 'No se pudo agregar la zona');
    }
    setSavingZone(false);
  };

  const removeZone = async (zoneId: number) => {
    if (!slug) return;
    try {
      await api.delete(`/stores/${slug}/delivery-zones/${zoneId}`);
      setZones(prev => prev.filter(zone => zone.id !== zoneId));
      toast.success('Zona de delivery eliminada');
    } catch (error) {
      console.error('Error eliminando zona', error);
      toast.error('No se pudo eliminar la zona');
    }
  };

  return (
    <AdminLayout title="Configuración">
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Store className="text-primary" /> Perfil del Negocio
            </CardTitle>
            <CardDescription>
              Configura los detalles públicos y la ubicación de tu sucursal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            {loading ? (
              <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Nombre del Local</label>
                  <Input
                    value={storeName}
                    onChange={e => setStoreName(e.target.value)}
                    className="h-12 bg-background border-border font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Tipo de Negocio / Industria</label>
                    <select
                      value={industry}
                      onChange={e => setIndustry(e.target.value)}
                      className="flex h-12 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="RESTAURANT">Comida Rápida / Restaurante</option>
                      <option value="SUPERMARKET">Víveres / Supermercado / Bodegón</option>
                      <option value="PHARMACY">Farmacia / Salud</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Color de Tema Visual</label>
                    <select
                      value={themeColor}
                      onChange={e => setThemeColor(e.target.value)}
                      className="flex h-12 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="orange">Naranja (Cálido / Comida Rápida)</option>
                      <option value="emerald">Esmeralda (Verde / Víveres)</option>
                      <option value="blue">Azul (Profesional / Farmacia)</option>
                      <option value="purple">Púrpura</option>
                      <option value="rose">Rosa / Coral</option>
                      <option value="amber">Ámbar</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <MapPin size={16} /> Ubicación (GPS)
                  </label>
                  <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="flex-1 space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Latitud</label>
                      <Input
                        type="number"
                        step="any"
                        value={mapPosition ? mapPosition[0] : ''}
                        onChange={e => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && mapPosition) setMapPosition([val, mapPosition[1]]);
                        }}
                        className="bg-background border-border"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Longitud</label>
                      <Input
                        type="number"
                        step="any"
                        value={mapPosition ? mapPosition[1] : ''}
                        onChange={e => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && mapPosition) setMapPosition([mapPosition[0], val]);
                        }}
                        className="bg-background border-border"
                      />
                    </div>
                  </div>

                  {mapPosition && (
                    <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-border shadow-inner relative z-0">
                      <MapContainer center={mapPosition as LatLngExpression} zoom={15} style={{ height: '100%', width: '100%' }} key={`${mapPosition[0]}-${mapPosition[1]}`}>
                        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <LocationMarker position={mapPosition} setPosition={setMapPosition} />
                      </MapContainer>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleSave} disabled={saving} className="h-12 px-8 font-black rounded-xl">
                    {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" size={18} />}
                    Guardar Cambios
                  </Button>
                </div>
              </>
            )}

          </CardContent>
        </Card>

        
        {/* F2E-B: CMS Modular de Landing y Diseño Visual */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <LayoutTemplate className="text-primary" /> Diseño y Landing Page (CMS Modular)
                </CardTitle>
                <CardDescription>
                  Personaliza textos, banners promocionales y qué secciones mostrar u ocultar en tu página web sin tocar código.
                </CardDescription>
              </div>
              <a
                href={`/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl border border-primary/30 text-primary hover:bg-primary/10 transition-colors w-fit"
              >
                <ExternalLink size={14} /> Ver Landing en Vivo
              </a>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Textos Principales del Hero */}
            <div className="space-y-4">
              <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <ImageIcon size={16} className="text-primary" /> Encabezado y Portada (Hero)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Eslogan / Título Principal</label>
                  <Input
                    placeholder="Ej. El sabor que amas, directo a tu mesa"
                    value={landingConfig.slogan}
                    onChange={e => setLandingConfig(prev => ({ ...prev, slogan: e.target.value }))}
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Distintivo Promocional (Badge)</label>
                  <Input
                    placeholder="Ej. Delivery Activo | Caliente y recién hecho"
                    value={landingConfig.badge_promo}
                    onChange={e => setLandingConfig(prev => ({ ...prev, badge_promo: e.target.value }))}
                    className="bg-background border-border"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Subtítulo Descriptivo</label>
                <Input
                  placeholder="Ej. Hamburguesas gourmet, perros calientes y combos para compartir con delivery veloz."
                  value={landingConfig.subtitle}
                  onChange={e => setLandingConfig(prev => ({ ...prev, subtitle: e.target.value }))}
                  className="bg-background border-border"
                />
              </div>

              {/* Subida de Imagen Hero */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Foto de Portada / Banner Principal</label>
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept="image/*"
                    disabled={isUploadingHero}
                    onChange={handleHeroUpload}
                    className="bg-background border-border file:bg-primary/10 file:text-primary file:border-0 file:rounded-lg file:font-semibold"
                  />
                  {landingConfig.hero_image_url && (
                    <img src={landingConfig.hero_image_url} alt="Portada" className="h-12 w-20 object-cover rounded-lg border border-border shadow-sm" />
                  )}
                </div>
              </div>
            </div>

            {/* F2E-09: Interruptores On/Off de Secciones */}
            <div className="pt-4 border-t border-border space-y-4">
              <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <LayoutTemplate size={16} className="text-primary" /> Estructura Modular (Activar / Ocultar Secciones)
              </h4>
              <p className="text-xs text-muted-foreground">
                Controla qué bloques aparecen en la landing de tu negocio. Si no tienes combos u ofertas activas, puedes apagarlos para que la web luzca limpia.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: 'categories', label: 'Categorías' },
                  { key: 'offers', label: 'Ofertas' },
                  { key: 'combos', label: 'Combos' },
                  { key: 'delivery_info', label: 'Info Delivery' },
                  { key: 'gallery', label: 'Galería Fotos' },
                  { key: 'about', label: 'Quiénes Somos' },
                  { key: 'testimonials', label: 'Testimonios' },
                  { key: 'contact', label: 'Contacto' }
                ].map(item => {
                  const isActive = (landingConfig.sections_visibility as any)[item.key] !== false;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => toggleSection(item.key)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isActive
                          ? 'border-primary/40 bg-primary/5 text-primary font-bold shadow-sm'
                          : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted/40 font-medium'
                      }`}
                    >
                      <span className="text-xs">{item.label}</span>
                      <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded-full font-black ${
                        isActive ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {isActive ? 'ON' : 'OFF'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* F2E-08: Banners Promocionales Rotativos */}
            <div className="pt-4 border-t border-border space-y-4">
              <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <ImageIcon size={16} className="text-primary" /> Banners Promocionales ({landingConfig.banners.length}/5)
              </h4>
              <p className="text-xs text-muted-foreground">
                Muestra anuncios destacados como "2x1 los Jueves" o "Combo Familiar con Refresco Gratis".
              </p>

              {/* Agregar nuevo banner */}
              {landingConfig.banners.length < 5 && (
                <div className="p-4 rounded-xl border border-dashed border-border bg-muted/10 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input
                      placeholder="Título del banner"
                      value={newBannerTitle}
                      onChange={e => setNewBannerTitle(e.target.value)}
                      className="bg-background border-border text-xs"
                    />
                    <Input
                      placeholder="Subtítulo opcional"
                      value={newBannerSubtitle}
                      onChange={e => setNewBannerSubtitle(e.target.value)}
                      className="bg-background border-border text-xs"
                    />
                    <Input
                      placeholder="Enlace o categoría (opcional)"
                      value={newBannerLink}
                      onChange={e => setNewBannerLink(e.target.value)}
                      className="bg-background border-border text-xs"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <Input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingBanner}
                        onChange={handleBannerUpload}
                        className="bg-background border-border text-xs file:bg-primary/10 file:text-primary file:border-0 file:rounded-lg file:font-semibold"
                      />
                      {newBannerImage && (
                        <img src={newBannerImage} alt="Preview" className="h-10 w-16 object-cover rounded-lg border border-border" />
                      )}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddBanner}
                      disabled={isUploadingBanner || (!newBannerImage && !newBannerTitle)}
                      className="font-bold text-xs whitespace-nowrap"
                    >
                      <Plus size={14} className="mr-1" /> Añadir Banner
                    </Button>
                  </div>
                </div>
              )}

              {/* Lista de banners */}
              {landingConfig.banners.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {landingConfig.banners.map(b => (
                    <div key={b.id} className="p-3 rounded-xl border border-border bg-card shadow-sm flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 overflow-hidden">
                        {b.image_url ? (
                          <img src={b.image_url} alt={b.title} className="h-12 w-16 object-cover rounded-lg border border-border flex-shrink-0" />
                        ) : (
                          <div className="h-12 w-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0"><ImageIcon size={18} className="text-muted-foreground" /></div>
                        )}
                        <div className="overflow-hidden">
                          <p className="font-bold text-xs truncate">{b.title || "Banner sin título"}</p>
                          {b.subtitle && <p className="text-[11px] text-muted-foreground truncate">{b.subtitle}</p>}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveBanner(b.id)}
                        className="text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg h-8 w-8 flex-shrink-0"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* F2E-10: Galería del Local / Fachada */}
            <div className="pt-4 border-t border-border space-y-4">
              <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <Camera size={16} className="text-primary" /> Galería de Fotos del Local ({landingConfig.gallery_images.length}/4)
              </h4>
              <p className="text-xs text-muted-foreground">
                Sube fotos de la fachada, mesas o cocina de tu negocio para generar confianza en tus clientes online.
              </p>

              {landingConfig.gallery_images.length < 4 && (
                <div className="flex items-center gap-3">
                  <Input
                    type="file"
                    accept="image/*"
                    disabled={isUploadingGallery}
                    onChange={handleGalleryUpload}
                    className="bg-background border-border text-xs file:bg-primary/10 file:text-primary file:border-0 file:rounded-lg file:font-semibold max-w-sm"
                  />
                  {isUploadingGallery && <span className="text-xs text-muted-foreground animate-pulse">Subiendo foto...</span>}
                </div>
              )}

              {landingConfig.gallery_images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {landingConfig.gallery_images.map((img, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-border shadow-sm h-28 bg-muted">
                      <img src={img} alt="Foto local" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryImage(idx)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600 text-white shadow-md hover:bg-red-700 transition opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
              <Button onClick={handleSave} disabled={saving} className="h-12 px-8 font-black rounded-xl">
                {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" size={18} />}
                Guardar Cambios de Diseño
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <DollarSign className="text-primary" /> Monedas y Tasas de Cambio
            </CardTitle>
            <CardDescription>
              Configura tu moneda principal y define las tasas de cambio para calcular los totales.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Moneda Base de la Tienda</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="flex h-12 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="USD">Dólares (USD)</option>
                <option value="VES">Bolívares (VES)</option>
                <option value="COP">Pesos Colombianos (COP)</option>
              </select>
              <p className="text-xs text-muted-foreground">Esta es la moneda en la que introduces los precios de tus productos.</p>
            </div>

            <div className="pt-4 border-t border-border">
              <h4 className="font-bold text-gray-900 mb-4">Tasas de Cambio</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground">Tasa BCV (Bs por 1 USD)</label>
                  <div className="flex gap-2">
                    <Input
                      type="number" step="any"
                      value={vesRate}
                      onChange={e => setVesRate(parseFloat(e.target.value))}
                      className="h-12 bg-background flex-1"
                    />
                    <Button onClick={syncBCV} disabled={syncing} variant="outline" className="h-12 text-primary border-primary/20 hover:bg-primary/10">
                      <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                      BCV
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Cuántos bolívares equivale 1 USD.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground">Tasa Pesos (COP por 1 USD)</label>
                  <Input
                    type="number" step="any"
                    value={copRate}
                    onChange={e => setCopRate(parseFloat(e.target.value))}
                    className="h-12 bg-background"
                  />
                  <p className="text-[11px] text-muted-foreground">Cuántos pesos colombianos equivale 1 USD.</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleSave} disabled={saving} className="h-12 px-8 font-black rounded-xl bg-primary hover:bg-primary/90 text-white">
                {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" size={18} />}
                Guardar Tasas
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Truck className="text-primary" /> Delivery
            </CardTitle>
            <CardDescription>
              Define una tarifa plana y zonas por distancia. Si la ubicación del cliente coincide con una zona, esa tarifa reemplaza la plana.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Tarifa plana ({currency})</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={deliveryFee}
                onChange={e => setDeliveryFee(Number(e.target.value))}
                className="h-12 bg-background border-border"
              />
              <p className="text-[11px] text-muted-foreground">
                Se aplica cuando el cliente no comparte ubicación o ninguna zona coincide.
              </p>
            </div>

            <div className="pt-4 border-t border-border space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-gray-900">Zonas por distancia</h4>
                  <p className="text-xs text-muted-foreground">Configura los precios según los kilómetros de viaje desde tu local.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loadingPresets}
                  onClick={loadPuertoAyacuchoPresets}
                  className="font-bold text-xs h-8 gap-1.5 border-emerald-300 text-emerald-800 hover:bg-emerald-50 rounded-lg w-fit"
                >
                  {loadingPresets ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} className="text-amber-500 fill-amber-500" />}
                  Cargar Zonas Sugeridas (Puerto Ayacucho)
                </Button>
              </div>

              {zones.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aún no hay zonas configuradas.</p>
              ) : (
                <div className="space-y-2">
                  {zones.map(zone => (
                    <div key={zone.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3">
                      <div>
                        <p className="text-sm font-bold">{zone.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {Number(zone.min_distance_km)} a {zone.max_distance_km === null ? '∞' : Number(zone.max_distance_km)} km · {currency} {Number(zone.fee).toFixed(2)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => removeZone(zone.id)}
                        aria-label={`Eliminar ${zone.name}`}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Nombre</label>
                  <Input
                    placeholder="Ej. Centro"
                    value={zoneForm.name}
                    onChange={e => setZoneForm(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Desde (km)</label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0"
                    value={zoneForm.min}
                    onChange={e => setZoneForm(prev => ({ ...prev, min: e.target.value }))}
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Hasta (km)</label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="∞"
                    value={zoneForm.max}
                    onChange={e => setZoneForm(prev => ({ ...prev, max: e.target.value }))}
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Tarifa</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={zoneForm.fee}
                    onChange={e => setZoneForm(prev => ({ ...prev, fee: e.target.value }))}
                    className="bg-background border-border"
                  />
                </div>
                <Button onClick={addZone} disabled={savingZone} className="h-10 rounded-xl font-bold">
                  {savingZone ? <Loader2 className="animate-spin mr-2" size={16} /> : <Plus className="mr-2" size={16} />}
                  Agregar
                </Button>
              </div>

              {/* Simulador Interactivo de Tarifas */}
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                    <Calculator size={14} className="text-primary" /> Simulador de Tarifa en Vivo
                  </span>
                  <span className="text-[11px] text-muted-foreground">Comprueba al instante cómo cobrará tu tienda</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600">Probar distancia:</span>
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      value={testKm}
                      onChange={e => setTestKm(e.target.value)}
                      placeholder="Ej. 4.5"
                      className="h-8 w-24 text-xs font-bold bg-white border-slate-300"
                    />
                    <span className="text-xs font-bold text-slate-600">km</span>
                  </div>
                  <div className="text-xs flex-1">
                    {(() => {
                      const km = parseFloat(testKm);
                      if (isNaN(km)) return <span className="text-muted-foreground">Escribe una distancia en km para simular.</span>;
                      const matchingZone = zones.find(z => km >= Number(z.min_distance_km) && (z.max_distance_km === null || km <= Number(z.max_distance_km)));
                      const approxMins = Math.round((km / 25) * 60) + 15;
                      if (matchingZone) {
                        return (
                          <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium">
                            ✓ Aplica zona: <strong className="font-black text-emerald-950">{matchingZone.name}</strong> · Tarifa cliente: <strong className="font-black text-emerald-700">{currency} {Number(matchingZone.fee).toFixed(2)}</strong> (~{approxMins} mins en moto)
                          </div>
                        );
                      }
                      return (
                        <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-medium">
                          ⚠️ Ninguna zona específica cubre {km} km · Aplicaría Tarifa Plana: <strong className="font-black">{currency} {deliveryFee.toFixed(2)}</strong> (~{approxMins} mins)
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleSave} disabled={saving} className="h-12 px-8 font-black rounded-xl bg-primary hover:bg-primary/90 text-white">
                {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" size={18} />}
                Guardar Delivery
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Bell className="text-primary" /> Notificaciones y Alertas Sonoras
            </CardTitle>
            <CardDescription>
              Ajusta cómo y cuándo recibes alertas de nuevos pedidos en el panel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-background rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="font-bold text-foreground flex items-center gap-2">
                  <Volume2 size={18} className="text-primary" />
                  Alerta Sonora de Nuevos Pedidos
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Reproduce un timbre cuando entra un nuevo pedido en tiempo real.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => playOrderChime()}
                  className="font-medium"
                >
                  <Volume2 size={16} className="mr-1.5" />
                  Probar Sonido
                </Button>
                <Button
                  type="button"
                  variant={soundEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const next = !soundEnabled;
                    setSoundEnabled(next);
                    localStorage.setItem('admin_sound_enabled', String(next));
                    toast.success(next ? 'Sonido activado' : 'Sonido silenciado');
                  }}
                  className={soundEnabled ? "bg-emerald-600 hover:bg-emerald-700 text-white font-bold" : "font-medium"}
                >
                  {soundEnabled ? 'Activado' : 'Silenciado'}
                </Button>
              </div>
            </div>

            <div className="p-4 bg-background rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="font-bold text-foreground flex items-center gap-2">
                  <Bell size={18} className="text-primary" />
                  Notificaciones de Escritorio
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Muestra avisos visuales en tu pantalla incluso si la pestaña está en segundo plano.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (!('Notification' in window)) {
                    toast.error('Este navegador no soporta notificaciones de escritorio.');
                    return;
                  }
                  const perm = await Notification.requestPermission();
                  if (perm === 'granted') {
                    toast.success('Permiso concedido para notificaciones.');
                  } else {
                    toast.error('Permiso denegado por el navegador.');
                  }
                }}
                className="font-medium"
              >
                Solicitar Permiso
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Landmark className="text-primary" /> Datos de Pago
            </CardTitle>
            <CardDescription>
              Se muestran al cliente cuando elige Pago Móvil o transferencia.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Banco</label>
                <Input
                  placeholder="Ej. Banco de Venezuela"
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  className="h-12 bg-background border-border"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Código del banco</label>
                <Input
                  placeholder="0102"
                  value={bankCode}
                  onChange={e => setBankCode(e.target.value)}
                  maxLength={4}
                  className="h-12 bg-background border-border"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Teléfono</label>
                <Input
                  placeholder="0412-1234567"
                  value={bankPhone}
                  onChange={e => setBankPhone(e.target.value)}
                  className="h-12 bg-background border-border"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Cédula / RIF</label>
                <Input
                  placeholder="V-12345678"
                  value={bankIdNumber}
                  onChange={e => setBankIdNumber(e.target.value)}
                  className="h-12 bg-background border-border"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Titular de la cuenta</label>
                <Input
                  placeholder="Nombre o razón social"
                  value={bankHolder}
                  onChange={e => setBankHolder(e.target.value)}
                  className="h-12 bg-background border-border"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Nota para el cliente</label>
                <Input
                  placeholder="Ej. Envía el comprobante por WhatsApp"
                  value={paymentNote}
                  onChange={e => setPaymentNote(e.target.value)}
                  className="h-12 bg-background border-border"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleSave} disabled={saving} className="h-12 px-8 font-black rounded-xl bg-primary hover:bg-primary/90 text-white">
                {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" size={18} />}
                Guardar Datos de Pago
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Shield className="text-primary" /> Seguridad y Sesión
            </CardTitle>
            <CardDescription>
              Cambia la contraseña de acceso y gestiona tu sesión administrativa.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleChangePassword} className="space-y-4">
              <p className="text-sm font-bold text-foreground flex items-center gap-2">
                <KeyRound size={16} className="text-primary" />
                Cambiar Contraseña de Administrador
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Contraseña actual
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    className="h-11 bg-background border-border"
                    autoComplete="current-password"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Nueva contraseña
                  </label>
                  <Input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="h-11 bg-background border-border"
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Confirmar nueva contraseña
                  </label>
                  <Input
                    type="password"
                    placeholder="Repite la contraseña"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="h-11 bg-background border-border"
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={changingPassword}
                  className="h-11 px-6 font-bold rounded-xl bg-primary hover:bg-primary/90 text-white"
                >
                  {changingPassword ? <Loader2 className="animate-spin mr-2" size={16} /> : <KeyRound className="mr-2" size={16} />}
                  Actualizar Contraseña
                </Button>
              </div>
            </form>

            <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="font-bold text-destructive flex items-center gap-2">
                  <LogOut size={16} />
                  Cerrar Sesión
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Finaliza la sesión activa en este navegador y vuelve a la pantalla de login.
                </p>
              </div>
              <Button
                type="button"
                variant="destructive"
                onClick={handleLogoutSession}
                disabled={loggingOut}
                className="font-bold h-10 px-5"
              >
                {loggingOut ? <Loader2 className="animate-spin mr-2" size={16} /> : <LogOut className="mr-2" size={16} />}
                Cerrar Sesión
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </AdminLayout>
  );
}
