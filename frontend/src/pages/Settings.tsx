import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import AdminLayout from '../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Store, Bell, Shield, MapPin, Save, Loader2, DollarSign, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { type LatLngExpression } from 'leaflet';

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
  const [usdRate, setUsdRate] = useState(1);
  const [vesRate, setVesRate] = useState(36.5);
  const [copRate, setCopRate] = useState(4000);
  const [syncing, setSyncing] = useState(false);

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
          if (res.data.store.usd_rate) setUsdRate(res.data.store.usd_rate);
          if (res.data.store.ves_rate) setVesRate(res.data.store.ves_rate);
          if (res.data.store.cop_rate) setCopRate(res.data.store.cop_rate);
        }
      } catch (error) {
        console.error("Error cargando configuración", error);
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
        usd_rate: usdRate,
        ves_rate: vesRate,
        cop_rate: copRate
      };
      if (mapPosition) {
        payload.latitude = mapPosition[0];
        payload.longitude = mapPosition[1];
      }
      await api.put(`/stores/${slug}/settings`, payload);
      alert('Configuración guardada exitosamente');
    } catch (error) {
      console.error("Error guardando", error);
      alert('Hubo un error al guardar la configuración');
    }
    setSaving(false);
  };

  const syncBCV = async () => {
    setSyncing(true);
    try {
      const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
      const data = await response.json();
      if (data && data.promedio) {
        setVesRate(data.promedio);
        alert(`Tasa BCV sincronizada: ${data.promedio} Bs.`);
      }
    } catch (err) {
      console.error(err);
      alert('Error sincronizando la tasa del BCV');
    }
    setSyncing(false);
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
                  <label className="text-sm font-bold text-muted-foreground">Tasa Dólar (USD)</label>
                  <Input
                    type="number" step="any"
                    value={usdRate}
                    onChange={e => setUsdRate(parseFloat(e.target.value))}
                    className="h-12 bg-background"
                  />
                  <p className="text-[11px] text-muted-foreground">¿A cuántos USD equivale 1 {currency}?</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground">Tasa Bolívares (VES)</label>
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
                  <p className="text-[11px] text-muted-foreground">¿A cuántos VES equivale 1 {currency}?</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground">Tasa Pesos (COP)</label>
                  <Input
                    type="number" step="any"
                    value={copRate}
                    onChange={e => setCopRate(parseFloat(e.target.value))}
                    className="h-12 bg-background"
                  />
                  <p className="text-[11px] text-muted-foreground">¿A cuántos COP equivale 1 {currency}?</p>
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
