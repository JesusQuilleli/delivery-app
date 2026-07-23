import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { formatPrice, getConversions } from '../utils/currency';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Phone, MapPin, CreditCard, ChevronRight, CheckCircle2, ShieldCheck, User as UserIcon, LocateFixed } from 'lucide-react';
import LoadingOverlay from '../components/LoadingOverlay';
import { toast } from 'sonner';

import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// @ts-ignore
function LocationMarker({ position, setPosition }) {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.flyTo(position, 16);
    }
  }, [position, map]);

  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  )
}

export default function Checkout() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { cart, total, clearCart } = useContext(CartContext);
  const { token, login, user } = useContext(AuthContext);

  const [step, setStep] = useState(token ? 3 : 1);
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+58');
  const [rawPhone, setRawPhone] = useState('');
  
  const cleanRaw = rawPhone.replace(/\D/g, '');
  const phone = `${countryCode}${cleanRaw.startsWith('0') && countryCode === '+58' ? cleanRaw.substring(1) : cleanRaw}`;
  
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);

  const [addressQuery, setAddressQuery] = useState(localStorage.getItem('last_address') || '');
  const [addressSuggestions, setAddressSuggestions] = useState<{ display_name: string; lat: string; lon: string }[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [address, setAddress] = useState(localStorage.getItem('last_address') || '');
  const [addressDetails, setAddressDetails] = useState(localStorage.getItem('last_address_details') || '');
  const [latitude, setLatitude] = useState<number | null>(parseFloat(localStorage.getItem('last_lat') || '') || null);
  const [longitude, setLongitude] = useState<number | null>(parseFloat(localStorage.getItem('last_lon') || '') || null);
  
  const defaultPosition: [number, number] = [5.6667, -67.6333]; // Puerto Ayacucho
  const [mapPosition, setMapPosition] = useState<[number, number]>(() => {
    return latitude && longitude ? [latitude, longitude] : defaultPosition;
  });
  const [paymentMethod, setPaymentMethod] = useState('');
  const [cashCurrency, setCashCurrency] = useState('USD');
  const [paymentReference, setPaymentReference] = useState('');
  const [orderStatus, setOrderStatus] = useState<string>('PENDING');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | null>(null);
  const [storeConfig, setStoreConfig] = useState<any>(null);
  const storeId = localStorage.getItem('current_store_id');

  useEffect(() => {
    api.get(`/stores/${slug}/products`).then(res => {
      setStoreConfig(res.data.store || null);
    }).catch(console.error);
  }, [slug]);

  useEffect(() => {
    if (step === 5 && user?.id) {
      const socketURL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
      const socket = io(socketURL);
      socket.on('connect', () => socket.emit('join_client', user.id));
      socket.on('estado_actualizado', (order) => setOrderStatus(order.status));
      return () => { socket.disconnect(); };
    }
  }, [step, user?.id]);

  // Autocomplete logic para LocationIQ (Búsqueda inteligente)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      // Solo buscar si hay más de 3 letras y el query no es exactamente la dirección seleccionada
      if (addressQuery.length > 3 && addressQuery !== address) {
        setIsSearchingAddress(true);
        try {
          // Token proporcionado por el usuario
          const token = 'pk.5e4e5017eb24eea8537c98df5437797f';
          
          // Bounding Box para limitar la búsqueda estrictamente a Puerto Ayacucho (y alrededores)
          // Formato LocationIQ: lon_left, lat_top, lon_right, lat_bottom
          const viewbox = '-67.68,5.72,-67.58,5.62';
          
          // bounded=1 obliga a que los resultados estén dentro del viewbox
          // countrycodes=ve asegura que solo devuelva resultados en Venezuela
          const url = `https://api.locationiq.com/v1/autocomplete.php?key=${token}&q=${encodeURIComponent(addressQuery)}&limit=5&viewbox=${viewbox}&bounded=1&countrycodes=ve`;
          
          const res = await fetch(url);
          
          if (res.ok) {
            const data = await res.json();
            setAddressSuggestions(data);
            setShowSuggestions(true);
          } else {
            setAddressSuggestions([]);
            setShowSuggestions(false);
          }
        } catch(e) {
          console.error('Error fetching address suggestions:', e);
          setAddressSuggestions([]);
          setShowSuggestions(false);
        }
        setIsSearchingAddress(false);
      } else {
        setAddressSuggestions([]);
        setShowSuggestions(false);
      }
    }, 800);

    return () => clearTimeout(delayDebounceFn);
  }, [addressQuery, address]);

  const selectAddress = (suggestion: { display_name: string; lat: string; lon: string }) => {
    // Limpiamos un poco el display name si trae mucho texto genérico
    const cleanName = suggestion.display_name.replace(', Venezuela', '').trim();
    setAddressQuery(cleanName);
    setAddress(cleanName);
    const lat = parseFloat(suggestion.lat);
    const lon = parseFloat(suggestion.lon);
    setLatitude(lat);
    setLongitude(lon);
    setMapPosition([lat, lon]);
    setShowSuggestions(false);
  };

  const handleGPSLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Tu navegador o dispositivo no soporta geolocalización.");
      return;
    }

    setIsSearchingAddress(true);
    
    // Función auxiliar para usar IP si todo falla
    const useIpFallback = async (reason: string) => {
      toast.warning(`Usando ubicación aproximada (${reason}). Por favor, ajusta el pin en el mapa manualmente.`);
      try {
        const ipRes = await fetch('https://ipapi.co/json/');
        const ipData = await ipRes.json();
        
        if (ipData.latitude && ipData.longitude) {
          const lat = ipData.latitude;
          const lon = ipData.longitude;
          
          setLatitude(lat);
          setLongitude(lon);
          setMapPosition([lat, lon]);

          const token = 'pk.5e4e5017eb24eea8537c98df5437797f';
          const res = await fetch(`https://us1.locationiq.com/v1/reverse.php?key=${token}&lat=${lat}&lon=${lon}&format=json`);
          if (res.ok) {
            const data = await res.json();
            const cleanName = data.display_name.replace(', Venezuela', '').trim();
            setAddressQuery(cleanName);
            setAddress(cleanName);
          }
        }
      } catch (fallbackError) {
        console.error("El respaldo por IP falló", fallbackError);
      } finally {
        setIsSearchingAddress(false);
      }
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        setLatitude(lat);
        setLongitude(lon);
        setMapPosition([lat, lon]);

        try {
          const token = 'pk.5e4e5017eb24eea8537c98df5437797f';
          const res = await fetch(`https://us1.locationiq.com/v1/reverse.php?key=${token}&lat=${lat}&lon=${lon}&format=json`);
          if (res.ok) {
            const data = await res.json();
            const addressObj = data.address || {};
            // Intentar construir una dirección más específica si está disponible
            let specificName = data.display_name;
            if (addressObj.road || addressObj.neighbourhood || addressObj.suburb) {
               const parts = [addressObj.road, addressObj.neighbourhood, addressObj.suburb, addressObj.city].filter(Boolean);
               if (parts.length > 0) {
                 specificName = parts.join(', ');
               }
            }
            const cleanName = specificName.replace(', Venezuela', '').trim();
            setAddressQuery(cleanName);
            setAddress(cleanName);
            toast.success("¡Ubicación precisa obtenida con éxito!");
          }
        } catch (error) {
          console.error("Error reverse geocoding", error);
        }
        setIsSearchingAddress(false);
      },
      (error) => {
        console.warn("Error con GPS nativo:", error);
        
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Permiso de ubicación denegado. Debes autorizar el uso de GPS en tu navegador o celular para una ubicación precisa.");
          useIpFallback("Permiso denegado");
        } else if (error.code === error.TIMEOUT) {
          useIpFallback("La señal GPS tardó mucho");
        } else {
          useIpFallback("GPS no disponible");
        }
      },
      { enableHighAccuracy: true, timeout: 25000, maximumAge: 0 } // Aumentamos el timeout a 25 segundos para celulares lentos
    );
  };

  useEffect(() => {
    if (mapPosition && mapPosition !== defaultPosition) {
      setLatitude(mapPosition[0]);
      setLongitude(mapPosition[1]);
    }
  }, [mapPosition]);

  useEffect(() => {
    if (cart.length === 0 && step !== 5) {
      navigate(`/${slug}`);
    }
  }, [cart, navigate, slug, step]);

  const requestOtp = async () => {
    setLoading(true);
    try {
      const res = await api.post('/auth/check-email', { email, store_id: storeId });
      setIsRegistered(res.data.is_registered);
      if (res.data.user_name) setName(res.data.user_name);
      if (res.data.user_phone) {
        const p = res.data.user_phone;
        const match = p.match(/^(\+\d{1,3})(\d+)$/);
        if (match) {
          setCountryCode(match[1]);
          setRawPhone(match[2]);
        } else {
          setRawPhone(p);
        }
      }
      setStep(2);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || "Error al solicitar código");
    }
    setLoading(false);
  };

  const resendOtp = async () => {
    setLoading(true);
    try {
      await api.post('/auth/check-email', { email, store_id: storeId });
      toast.success("Código reenviado exitosamente a tu correo.");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || "Error al reenviar código");
    }
    setLoading(false);
  };

  const verifyOtp = async () => {
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email, code: otp, store_id: storeId, name, phone });
      login(res.data.user);
      setStep(3);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || "Código incorrecto");
    }
    setLoading(false);
  };

  const confirmOrder = async () => {
    setLoading(true);
    try {
      const res = await api.post('/orders/place', {
        store_id: storeId,
        items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity, unit_price: i.unit_price })),
        delivery_address: `${address} | Detalles: ${addressDetails || 'Sin detalles extra'}`,
        latitude: latitude,
        longitude: longitude,
        total_amount: total,
        payment_method: paymentMethod,
        payment_reference: paymentMethod === 'TRANSFER' ? paymentReference : `Efectivo en ${cashCurrency}`
      });
      
      if (res.data.estimated_minutes) {
        setEstimatedMinutes(res.data.estimated_minutes);
      }
      
      localStorage.setItem('last_address', address);
      localStorage.setItem('last_address_details', addressDetails);
      if (latitude) localStorage.setItem('last_lat', latitude.toString());
      if (longitude) localStorage.setItem('last_lon', longitude.toString());

      clearCart();
      setStep(5);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || "Error al confirmar el pedido");
    }
    setLoading(false);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Card className="border-none shadow-2xl backdrop-blur-xl bg-white/90">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30 transform rotate-3 hover:rotate-0 transition-transform">
                <UserIcon className="text-white" size={36} />
              </div>
              <CardTitle className="text-3xl font-black text-gray-900 tracking-tight">Tu Correo</CardTitle>
              <CardDescription className="text-base mt-2">Inicia sesión de forma segura y sin contraseñas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="flex gap-2">
                <Input 
                  type="email" 
                  placeholder="Ej: correo@ejemplo.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 h-16 text-xl text-left pl-4 font-bold tracking-wider rounded-2xl bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all shadow-inner"
                />
              </div>
              <Button onClick={requestOtp} className="w-full h-16 text-lg rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-xl shadow-blue-500/20 font-black text-white transition-all transform hover:scale-[1.02]" disabled={!email || loading}>
                {loading ? 'Cargando...' : 'Recibir Código Seguro'} <ChevronRight className="ml-2" />
              </Button>
            </CardContent>
          </Card>
        );
      case 2:
        return (
          <Card className="border-none shadow-2xl backdrop-blur-xl bg-white/90 animate-in fade-in slide-in-from-right-8 duration-500">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-orange-500/30 transform -rotate-3 hover:rotate-0 transition-transform">
                <ShieldCheck className="text-white" size={36} />
              </div>
              <CardTitle className="text-3xl font-black text-gray-900 tracking-tight">
                Verificación Segura
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Hemos enviado un código a tu correo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              
              <div className="mb-4 bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
                <label className="text-sm font-bold text-orange-900 mb-2 flex items-center gap-2">
                  <UserIcon size={16} /> {isRegistered && name ? '¡Bienvenido de nuevo!' : '¿Cómo te llamas?'}
                </label>
                <Input 
                  type="text" 
                  placeholder="Ej: Juan Pérez" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  disabled={isRegistered && !!name}
                  className={`h-14 text-lg rounded-xl transition-all ${(isRegistered && !!name) ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' : 'bg-white focus:border-orange-500 focus:ring-orange-500'}`}
                />
              </div>

              <div className="mb-4 bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
                <label className="text-sm font-bold text-orange-900 mb-2 flex items-center gap-2">
                  <Phone size={16} /> {isRegistered && rawPhone ? 'Tu teléfono registrado' : 'Número de Teléfono (Para el delivery)'}
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    disabled={isRegistered && !!rawPhone}
                    className={`h-14 px-2 text-lg font-bold rounded-xl border border-orange-200 transition-all ${(isRegistered && !!rawPhone) ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500 cursor-pointer outline-none'}`}
                  >
                    <option value="+58">🇻🇪 +58</option>
                    <option value="+57">🇨🇴 +57</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+34">🇪🇸 +34</option>
                    <option value="+56">🇨🇱 +56</option>
                    <option value="+54">🇦🇷 +54</option>
                    <option value="+51">🇵🇪 +51</option>
                    <option value="+593">🇪🇨 +593</option>
                    <option value="+507">🇵🇦 +507</option>
                  </select>
                  <Input 
                    type="tel" 
                    placeholder="Ej: 4120000000" 
                    value={rawPhone} 
                    onChange={(e) => setRawPhone(e.target.value)}
                    disabled={isRegistered && !!rawPhone}
                    className={`flex-1 h-14 text-lg rounded-xl transition-all ${(isRegistered && !!rawPhone) ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' : 'bg-white focus:border-orange-500 focus:ring-orange-500'}`}
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label className="text-sm font-bold text-gray-700 mb-2 block">Código de Seguridad (6 dígitos)</label>
                <Input 
                  type="text" 
                  placeholder="000000" 
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value)}
                  className="h-16 text-3xl text-center font-black tracking-[0.5em] rounded-2xl bg-gray-50 focus:border-orange-500 focus:ring-orange-500 transition-all"
                  maxLength={6}
                />
              </div>

              <Button onClick={verifyOtp} className="w-full h-16 text-lg rounded-2xl bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 shadow-xl shadow-orange-500/20 font-black text-white transition-all transform hover:scale-[1.02]" disabled={otp.length < 6 || ((!isRegistered || !name) && name.length < 3) || ((!isRegistered || !rawPhone) && rawPhone.length < 7) || loading}>
                {loading ? 'Verificando...' : 'Validar y Continuar'} <ChevronRight className="ml-2" />
              </Button>
              
              <div className="text-center mt-4">
                <Button variant="link" onClick={resendOtp} disabled={loading} className="text-orange-600 font-bold hover:text-orange-700">
                  ¿No recibiste el código? Reenviar
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      case 3:
        return (
          <Card className="border-none shadow-2xl backdrop-blur-xl bg-white/90 animate-in fade-in slide-in-from-right-8 duration-500 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 p-6">
              <CardTitle className="flex items-center gap-3 text-2xl font-black text-gray-900">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <MapPin className="text-orange-600"/>
                </div> 
                ¿A dónde enviamos?
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-3 relative z-20">
                <label className="text-sm font-bold text-gray-700 block">Busca tu Dirección en Puerto Ayacucho</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-[18px] text-orange-500" size={20} />
                  <Input 
                    placeholder="Ej: Sector 57..." 
                    value={addressQuery} 
                    onChange={(e) => {
                      setAddressQuery(e.target.value);
                      if(e.target.value !== address) setAddress(''); 
                    }}
                    onFocus={() => { if(addressSuggestions.length > 0) setShowSuggestions(true); }}
                    className="h-14 pl-12 rounded-xl text-lg bg-gray-50 focus:bg-white transition-colors"
                  />
                  {isSearchingAddress && <div className="absolute right-4 top-[18px] w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>}
                </div>

                <Button 
                  variant="outline" 
                  onClick={handleGPSLocation}
                  disabled={isSearchingAddress}
                  className="w-full flex items-center justify-center gap-2 text-orange-600 border-orange-200 hover:bg-orange-50 h-12 rounded-xl mt-2 font-bold"
                >
                  <LocateFixed size={18} /> 
                  {isSearchingAddress ? 'Ubicando...' : 'Usar mi ubicación actual por GPS'}
                </Button>

                {showSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute z-[1000] w-full bg-white border border-gray-200 shadow-2xl rounded-xl mt-1 overflow-hidden max-h-60 overflow-y-auto">
                    {addressSuggestions.map((sug, i) => (
                      <div 
                        key={i} 
                        className="p-4 hover:bg-orange-50 cursor-pointer border-b border-gray-100 last:border-0 text-sm text-gray-700 flex items-start gap-2"
                        onClick={() => selectAddress(sug)}
                      >
                        <MapPin size={16} className="text-orange-400 mt-0.5 flex-shrink-0" />
                        <span>{sug.display_name.replace(', Venezuela', '')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Mapa Interactivo */}
              <div className="space-y-2 relative rounded-2xl overflow-hidden border border-gray-200 shadow-inner h-64 z-0">
                <MapContainer center={mapPosition} zoom={15} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    attribution='&copy; <a href="https://locationiq.com/?ref=maps">LocationIQ</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}-tiles.locationiq.com/v3/streets/r/{z}/{x}/{y}.png?key=pk.5e4e5017eb24eea8537c98df5437797f"
                  />
                  <LocationMarker position={mapPosition} setPosition={setMapPosition} />
                </MapContainer>
                <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm p-2 rounded-xl text-xs text-center text-gray-600 font-medium z-[400] shadow-sm pointer-events-none border border-gray-100">
                  Toca el mapa para ajustar la ubicación exacta
                </div>
              </div>

              {address && (
                <div className="space-y-3 bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 animate-in fade-in slide-in-from-top-4">
                  <label className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-500" /> Dirección Confirmada
                  </label>
                  <p className="text-xs text-emerald-700 mb-2">Añade detalles específicos (Piso, Casa, Apartamento, Referencias):</p>
                  <Input 
                    placeholder="Ej: Casa amarilla portón negro, al lado de la panadería..." 
                    value={addressDetails} 
                    onChange={(e) => setAddressDetails(e.target.value)}
                    className="h-12 rounded-xl bg-white border-emerald-200 focus:border-emerald-500"
                  />
                </div>
              )}

              <Button onClick={() => setStep(4)} className="w-full h-16 text-lg rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 hover:from-black hover:to-gray-900 shadow-xl shadow-gray-900/20 font-black text-white transition-all transform hover:scale-[1.02]" disabled={!address}>
                Continuar al Pago <ChevronRight className="ml-2" />
              </Button>
            </CardContent>
          </Card>
        );
      case 4:
        return (
          <Card className="border-none shadow-2xl backdrop-blur-xl bg-white/90 animate-in fade-in slide-in-from-right-8 duration-500 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 p-6">
              <CardTitle className="flex items-center gap-3 text-2xl font-black text-gray-900">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CreditCard className="text-emerald-600"/>
                </div> 
                Método de Pago
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div 
                  onClick={() => setPaymentMethod('CASH')}
                  className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex flex-col items-center gap-3 relative overflow-hidden ${paymentMethod === 'CASH' ? 'border-emerald-500 bg-emerald-50/50 shadow-lg shadow-emerald-500/10 scale-[1.02]' : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'}`}
                >
                  {paymentMethod === 'CASH' && <div className="absolute top-2 right-2"><CheckCircle2 className="text-emerald-500" size={20} /></div>}
                  <span className="text-4xl">💵</span>
                  <span className={`font-black ${paymentMethod === 'CASH' ? 'text-emerald-700' : 'text-gray-600'}`}>Efectivo</span>
                </div>
                <div 
                  onClick={() => setPaymentMethod('TRANSFER')}
                  className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex flex-col items-center gap-3 relative overflow-hidden ${paymentMethod === 'TRANSFER' ? 'border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-500/10 scale-[1.02]' : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'}`}
                >
                  {paymentMethod === 'TRANSFER' && <div className="absolute top-2 right-2"><CheckCircle2 className="text-blue-500" size={20} /></div>}
                  <span className="text-4xl">📱</span>
                  <span className={`font-black ${paymentMethod === 'TRANSFER' ? 'text-blue-700' : 'text-gray-600'}`}>Pago Móvil</span>
                </div>
              </div>

              {paymentMethod === 'CASH' && (
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-2xl border border-emerald-200 shadow-inner space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                  <p className="text-sm font-black text-emerald-900 uppercase tracking-wider text-center">¿En qué moneda vas a pagar al recibir?</p>
                  <div className="grid grid-cols-3 gap-3">
                    {['USD', 'VES', 'COP'].map(curr => (
                      <div 
                        key={curr}
                        onClick={() => setCashCurrency(curr)}
                        className={`py-3 rounded-xl border-2 text-center cursor-pointer font-black transition-all ${
                          cashCurrency === curr 
                            ? 'bg-emerald-500 border-emerald-600 text-white shadow-md transform scale-105' 
                            : 'bg-white border-emerald-100 text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {curr === 'USD' ? 'Dólares' : curr === 'VES' ? 'Bolívares' : 'Pesos'}
                      </div>
                    ))}
                  </div>
                  <div className="bg-white p-4 rounded-xl text-center border border-emerald-100 shadow-sm mt-4">
                    <span className="text-gray-500 text-sm">Monto a tener listo:</span><br/>
                    <strong className="text-2xl text-emerald-700 font-black">
                      {cashCurrency === storeConfig?.currency ? formatPrice(total, cashCurrency) : (getConversions(total, storeConfig) as any)?.[cashCurrency]}
                    </strong>
                  </div>
                </div>
              )}

              {paymentMethod === 'TRANSFER' && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl border border-gray-200 shadow-inner space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                  <p className="text-sm font-black text-gray-800 uppercase tracking-wider">Datos de Transferencia:</p>
                  <div className="text-sm text-gray-700 bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2">
                    <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Banco:</span> <strong className="font-black">0102 - Venezuela</strong></div>
                    <div className="flex justify-between border-b pb-2 pt-1"><span className="text-gray-500">Teléfono:</span> <strong className="font-black">0412-1234567</strong></div>
                    <div className="flex justify-between border-b pb-2 pt-1"><span className="text-gray-500">Cédula:</span> <strong className="font-black">V-12345678</strong></div>
                    <div className="flex justify-between pt-2 items-center">
                      <span className="text-gray-500">Monto:</span> 
                      <div className="text-right">
                        <strong className="text-xl text-emerald-600 font-black">{formatPrice(total, storeConfig?.currency)}</strong>
                        {storeConfig && storeConfig.currency !== 'VES' && (
                          <div className="text-xs font-bold text-gray-500 mt-1">
                            Equivalente: {getConversions(total, storeConfig)?.VES}
                          </div>
                        )}
                        {storeConfig && storeConfig.currency !== 'COP' && (
                          <div className="text-xs font-bold text-gray-500">
                            Equivalente: {getConversions(total, storeConfig)?.COP}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <Input 
                    placeholder="Número de Referencia (últimos 6 dígitos)" 
                    value={paymentReference} 
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="h-14 rounded-xl font-bold tracking-widest text-center"
                    maxLength={10}
                  />
                </div>
              )}

              <Button 
                onClick={confirmOrder} 
                className={`w-full h-16 text-lg rounded-2xl font-black text-white transition-all transform shadow-xl ${!paymentMethod || (paymentMethod === 'TRANSFER' && !paymentReference) || loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:scale-[1.02] hover:shadow-orange-500/30'}`}
                disabled={!paymentMethod || (paymentMethod === 'TRANSFER' && !paymentReference) || loading}
              >
                {loading ? 'Procesando Seguro...' : 'Confirmar y Pagar'} <CheckCircle2 className="ml-2" />
              </Button>
            </CardContent>
          </Card>
        );
      case 5: {
        const isTransfer = paymentMethod === 'TRANSFER';
        const timeline = isTransfer ? [
          { status: 'AWAITING_PAYMENT', title: 'Validando Pago', desc: 'Verificando transferencia.', icon: '💸' },
          { status: 'PENDING', title: 'Pedido Recibido', desc: 'Confirmando tu orden.', icon: '📦' },
          { status: 'ACCEPTED', title: 'Preparando', desc: 'Empacando productos.', icon: '🛍️' },
          { status: 'DISPATCHED', title: 'En Camino', desc: 'El motorizado va hacia ti.', icon: '🛵' },
          { status: 'DELIVERED', title: 'Entregado', desc: '¡Gracias por comprar!', icon: '✨' }
        ] : [
          { status: 'PENDING', title: 'Pedido Recibido', desc: 'Confirmando tu orden.', icon: '📦' },
          { status: 'ACCEPTED', title: 'Preparando', desc: 'Empacando productos.', icon: '🛍️' },
          { status: 'DISPATCHED', title: 'En Camino', desc: 'El motorizado va hacia ti.', icon: '🛵' },
          { status: 'DELIVERED', title: 'Entregado', desc: '¡Gracias por comprar!', icon: '✨' }
        ];

        let currentIndex = 0;
        if (orderStatus === 'PENDING' && isTransfer) currentIndex = 1;
        if (orderStatus === 'ACCEPTED') currentIndex = isTransfer ? 2 : 1;
        if (orderStatus === 'DISPATCHED') currentIndex = isTransfer ? 3 : 2;
        if (orderStatus === 'DELIVERED') currentIndex = isTransfer ? 4 : 3;

        return (
          <Card className="border-none shadow-2xl backdrop-blur-xl bg-white/95 overflow-hidden rounded-[2rem]">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 w-full"></div>
            <CardHeader className="text-center pb-8 pt-8 bg-gradient-to-b from-orange-50/50 to-white">
              <CardTitle className="text-3xl font-black text-gray-900 tracking-tight">Estado del Pedido</CardTitle>
              {estimatedMinutes ? (
                <div className="mt-4 bg-orange-100/80 text-orange-800 p-4 rounded-2xl font-black border border-orange-200 text-lg shadow-sm">
                  ⏳ Llegada Estimada: ~{estimatedMinutes} mins
                </div>
              ) : (
                <CardDescription className="text-orange-600 font-bold mt-2 animate-pulse">
                  {orderStatus === 'AWAITING_PAYMENT' ? 'Validando tu pago móvil...' : 'Actualización en tiempo real...'}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="p-8 px-10">
              <div className="relative border-l-4 border-gray-100 ml-6 space-y-10">
                {timeline.map((item, index) => {
                  const isCompleted = index <= currentIndex;
                  const isActive = index === currentIndex;
                  
                  return (
                    <div key={item.status} className={`relative pl-10 transition-all duration-700 ${isCompleted ? 'opacity-100 transform translate-x-0' : 'opacity-40 transform translate-x-2'}`}>
                      {/* Círculo indicador con icono */}
                      <div className={`absolute -left-[26px] top-0 w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg transition-all duration-500 ${
                        isActive ? 'bg-orange-500 text-white shadow-orange-500/40 animate-bounce' : 
                        isCompleted ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400 grayscale'
                      }`}>
                        {item.icon}
                      </div>
                      
                      <div className="flex flex-col pt-1">
                        <h3 className={`font-black text-xl transition-colors ${isActive ? 'text-orange-600' : 'text-gray-900'}`}>
                          {item.title}
                        </h3>
                        <p className="text-gray-500 font-medium text-sm mt-1">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {orderStatus === 'DELIVERED' && (
                <div className="mt-12 pt-8 border-t border-gray-100 animate-in slide-in-from-bottom-8 duration-700">
                  <Button onClick={() => navigate(`/${slug}`)} className="w-full h-16 text-lg rounded-2xl font-black bg-gradient-to-r from-orange-500 to-orange-600 shadow-xl shadow-orange-500/20 text-white hover:scale-[1.02] transition-transform">
                    Hacer otro pedido
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      }
      default: return null;
    }
  };

  return (
    <div className="px-4 pt-10 pb-20 min-h-[80vh] flex flex-col justify-center bg-gray-50">
      <div className="max-w-md mx-auto w-full">
        {step < 5 && (
          <div className="flex justify-between items-center mb-10 px-4 relative">
            <div className="absolute left-8 right-8 h-1.5 bg-gray-200 top-4 -z-10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-orange-500 transition-all duration-500" 
                style={{ width: `${((step - 1) / 3) * 100}%` }}
              ></div>
            </div>
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all duration-500 ${step >= s ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-110' : 'bg-white text-gray-400 border-2 border-gray-200'}`}>
                  {s}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="transition-all duration-500">
          <LoadingOverlay isLoading={loading} />
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
