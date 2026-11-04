import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import AdminLayout from '../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Store, Bell, Shield, MapPin, Save, Loader2, DollarSign, RefreshCw, Truck, Plus, Trash2, Landmark } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { type LatLngExpression } from 'leaflet';
import { toast } from 'sonner';

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
  const [mapPosition, setMapPosition] = useState<[number, number] | null>(null);

  const [currency, setCurrency] = useState('USD');
  const [vesRate, setVesRate] = useState(36.5);
  const [copRate, setCopRate] = useState(4000);
  const [syncing, setSyncing] = useState(false);

  const [deliveryFee, setDeliveryFee] = useState(0);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [zoneForm, setZoneForm] = useState({ name: '', min: '', max: '', fee: '' });
  const [savingZone, setSavingZone] = useState(false);

  const [bankName, setBankName] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [bankPhone, setBankPhone] = useState('');
  const [bankIdNumber, setBankIdNumber] = useState('');
  const [bankHolder, setBankHolder] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await api.get(`/stores/${slug}/products`);
        if (res.data && res.data.store) {
          setStoreName(res.data.store.name);
          if (res.data.store.latitude && res.data.store.longitude) {
            setMapPosition([res.data.store.latitude, res.data.store.longitude]);
          } else {
            setMapPosition([5.6667, -67.6333]); // Default Puerto Ayacucho
          }
          if (res.data.store.currency) setCurrency(res.data.store.currency);
          if (res.data.store.ves_rate) setVesRate(res.data.store.ves_rate);
          if (res.data.store.cop_rate) setCopRate(res.data.store.cop_rate);
          if (res.data.store.delivery_fee !== undefined) setDeliveryFee(Number(res.data.store.delivery_fee));
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
        currency,
        ves_rate: vesRate,
        cop_rate: copRate,
        delivery_fee: deliveryFee,
        bank_name: bankName,
        bank_code: bankCode,
        bank_phone: bankPhone,
        bank_id_number: bankIdNumber,
        bank_holder: bankHolder,
        payment_note: paymentNote
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
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
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
              <h4 className="font-bold text-gray-900">Zonas por distancia</h4>

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
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleSave} disabled={saving} className="h-12 px-8 font-black rounded-xl bg-primary hover:bg-primary/90 text-white">
                {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" size={18} />}
                Guardar Delivery
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm opacity-50">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Bell className="text-primary" /> Notificaciones
            </CardTitle>
            <CardDescription>
              Ajusta cómo y cuándo recibes alertas de nuevos pedidos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-xl border border-dashed border-border text-center">
              <p className="text-muted-foreground text-sm font-semibold mb-4">Esta sección está en desarrollo.</p>
              <Button variant="outline" disabled>Configurar Alertas</Button>
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

        <Card className="border-border shadow-sm opacity-50">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Shield className="text-primary" /> Seguridad
            </CardTitle>
            <CardDescription>
              Cambia tu contraseña y ajusta la seguridad de tu cuenta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-xl border border-dashed border-border text-center">
              <p className="text-muted-foreground text-sm font-semibold mb-4">Esta sección está en desarrollo.</p>
              <Button variant="outline" disabled>Cambiar Contraseña</Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </AdminLayout>
  );
}
