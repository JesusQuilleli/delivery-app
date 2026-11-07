import { useEffect, useRef, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { formatPrice, getConversions } from '../utils/currency';
import { parsePhone } from '../utils/phone';
import { useClientRealtime } from '../context/RealtimeContext';
import { createSocket } from '../lib/socket';
import { requestNotificationPermission } from '../lib/notifications';
import { NotificationPermissionBanner } from '../components/NotificationPermissionBanner';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Phone, MapPin, CreditCard, ChevronRight, CheckCircle2, ShieldCheck, User as UserIcon, LocateFixed, Home, Briefcase, AlertTriangle, Edit3, XCircle, Navigation, Mail, MessageSquare, Camera, Upload, Sparkles } from 'lucide-react';
import LoadingOverlay from '../components/LoadingOverlay';
import { toast } from 'sonner';
import { CancelOrderModal, EditOrderModal } from '../components/OrderActionModals';

import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface StoreConfig {
  id: number;
  name?: string;
  industry?: string;
  latitude?: number | null;
  longitude?: number | null;
  currency?: string;
  usd_rate?: number;
  ves_rate?: number;
  cop_rate?: number;
  delivery_fee?: number;
  bank_name?: string | null;
  bank_code?: string | null;
  bank_phone?: string | null;
  bank_id_number?: string | null;
  bank_holder?: string | null;
  payment_note?: string | null;
}

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
    <Marker
      position={position}
      draggable
      eventHandlers={{
        dragend: (event: L.DragEndEvent) => {
          const { lat, lng } = event.target.getLatLng();
          setPosition([lat, lng]);
        }
      }}
    ></Marker>
  )
}

export default function Checkout() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { cart, total, clearCart } = useContext(CartContext);
  const { token, login, user, isInitializing } = useContext(AuthContext);
  const { subscribe } = useClientRealtime();

  const [step, setStep] = useState(token ? 3 : 1);
  const currentStep = token && step === 1 ? 3 : step;
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+58');
  const [rawPhone, setRawPhone] = useState('');
  
  const cleanRaw = rawPhone.replace(/\D/g, '').replace(/^0+/, '');
  const parsedPhone = parsePhone(`${countryCode}${cleanRaw}`);
  const phone = parsedPhone.isValid
    ? parsedPhone.e164
    : `${countryCode}${cleanRaw}`;
  
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);

  const [addressQuery, setAddressQuery] = useState(localStorage.getItem('last_address') || '');
  const [addressSuggestions, setAddressSuggestions] = useState<{ place_id?: number | string; display_name: string; latitude: number; longitude: number; address?: Record<string, string | null> }[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [address, setAddress] = useState(localStorage.getItem('last_address') || '');
  const [addressDetails, setAddressDetails] = useState(localStorage.getItem('last_address_details') || '');
  const [latitude, setLatitude] = useState<number | null>(parseFloat(localStorage.getItem('last_lat') || '') || null);
  const [longitude, setLongitude] = useState<number | null>(parseFloat(localStorage.getItem('last_lon') || '') || null);
  const [savedAddresses, setSavedAddresses] = useState<{ address: string; address_details: string | null; latitude: number; longitude: number }[]>([]);

  const defaultPosition: [number, number] = [5.6667, -67.6333];
  const [mapPosition, setMapPosition] = useState<[number, number] | null>(() => {
    return latitude && longitude ? [latitude, longitude] : null;
  });
  const skipNextReverse = useRef(false);
  const [deliveryQuote, setDeliveryQuote] = useState<{
    in_range: boolean | null;
    coverage?: { has_zones: boolean; max_distance_km: number | null; zones_count: number };
    distance_km: number | null;
    estimated_minutes: number | null;
    zone_name?: string | null;
  } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [cashCurrency, setCashCurrency] = useState('USD');
  const [paymentReference, setPaymentReference] = useState('');
  // F2G-06: Selección de canal OTP (Correo o WhatsApp)
  const [authChannel, setAuthChannel] = useState<'EMAIL' | 'WHATSAPP'>('EMAIL');
  const [whatsAppIdentifier, setWhatsAppIdentifier] = useState<string>('');
  const [whatsAppFallbackLink, setWhatsAppFallbackLink] = useState<string>('');
  const [demoOtpCode, setDemoOtpCode] = useState<string>('');

  // F2G-04 y F2G-05: Capture de Pago Móvil y OCR
  const [paymentReceiptUrl, setPaymentReceiptUrl] = useState<string>('');
  const [isUploadingReceipt, setIsUploadingReceipt] = useState<boolean>(false);
  const [ocrDetectedInfo, setOcrDetectedInfo] = useState<{ reference?: string | null; amount?: number | null } | null>(null);

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("El comprobante supera el límite de 5 MB");
      return;
    }
    setIsUploadingReceipt(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/upload/receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPaymentReceiptUrl(res.data.imageUrl);

      if (res.data.extracted?.reference) {
        setPaymentReference(res.data.extracted.reference);
      }

      if (res.data.extracted) {
        setOcrDetectedInfo(res.data.extracted);
        const expectedBs = expectedVes || 0;
        if (res.data.extracted.amount && expectedBs > 0 && res.data.extracted.amount < expectedBs * 0.98) {
          toast.error(
            `⚠️ Monto insuficiente en el comprobante: Detectamos Bs. ${res.data.extracted.amount.toFixed(2)}, pero el total es Bs. ${expectedBs.toFixed(2)}. Verifica tu comprobante antes de confirmar.`,
            { duration: 8000 }
          );
        } else if (res.data.extracted.amount && expectedBs > 0) {
          toast.success(`¡Monto y referencia validados! Bs. ${res.data.extracted.amount.toFixed(2)} - Ref: ${res.data.extracted.reference || 'Detectada'}`);
        } else if (res.data.extracted.reference) {
          toast.success(`¡Capture leído! Referencia bancaria detectada: ${res.data.extracted.reference}`);
        } else {
          toast.success("Capture cargado correctamente. Revisa y confirma la referencia abajo.");
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error al subir el comprobante de pago");
    } finally {
      setIsUploadingReceipt(false);
    }
  };
  const [prescriptionUrl, setPrescriptionUrl] = useState<string>('');
  const [isUploadingPrescription, setIsUploadingPrescription] = useState<boolean>(false);
  const requiresPrescription = cart.some(i => i.requires_prescription);

  const handlePrescriptionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("El archivo supera el límite de 5 MB");
      return;
    }
    setIsUploadingPrescription(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPrescriptionUrl(res.data.imageUrl);
      toast.success("Foto del récipe cargada correctamente");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error al subir la imagen del récipe");
    } finally {
      setIsUploadingPrescription(false);
    }
  };
  const [orderStatus, setOrderStatus] = useState<string>('PENDING');
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [placedOrderItems, setPlacedOrderItems] = useState<any[]>([]);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null);
  const [storeError, setStoreError] = useState<string | null>(null);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const storeId = storeConfig?.id;
  const mapCenter: [number, number] = storeConfig?.latitude != null && storeConfig?.longitude != null
    ? [Number(storeConfig.latitude), Number(storeConfig.longitude)]
    : defaultPosition;
  const grandTotal = total + deliveryFee;
  const expectedVes = (() => {
    if (!storeConfig) return 0;
    const vesRate = Number(storeConfig.ves_rate) || 36.5;
    const base = storeConfig.currency || 'USD';
    if (base === 'VES') return grandTotal;
    const usdRate = Number(storeConfig.usd_rate) || 1.0;
    return (grandTotal / usdRate) * vesRate;
  })();
  const isTransferReferenceValid = /^\d{4,10}$/.test(paymentReference);

  useEffect(() => {
    api.get(`/stores/${slug}/products`).then(res => {
      setStoreConfig(res.data.store || null);
      setDeliveryFee(Number(res.data.store?.delivery_fee) || 0);
    }).catch(err => {
      console.error('Error cargando configuración de tienda en checkout:', err);
      if (err.response?.status === 404 || err.response?.status === 403) {
        setStoreError(err.response?.data?.error || 'Esta tienda se encuentra temporalmente inactiva o no disponible.');
      }
    });
  }, [slug]);

  useEffect(() => {
    if (currentStep < 3 || currentStep === 5 || !slug || latitude === null || longitude === null) {
      return;
    }
    let cancelled = false;

    api.post(`/stores/${slug}/delivery-quote`, { latitude, longitude })
      .then(res => {
        if (cancelled) return;
        setDeliveryFee(Number(res.data.delivery_fee) || 0);
        setDeliveryQuote({
          in_range: res.data.in_range ?? null,
          coverage: res.data.coverage,
          distance_km: res.data.distance_km ?? null,
          estimated_minutes: res.data.estimated_minutes ?? null,
          zone_name: res.data.zone?.name ?? null
        });
      })
      .catch((err) => {
        console.error('Error cotizando delivery', err);
      });

    return () => {
      cancelled = true;
    };
  }, [currentStep, slug, latitude, longitude]);

  useEffect(() => {
    if (isInitializing) return;
    if (currentStep === 5 && (user?.id || orderId)) {
      // Carga el estado REAL desde la BD y activa polling de 4s para actualizar sin refrescar
      const syncFromDb = async () => {
        try {
          const res = await api.get('/orders/my-orders');
          const orders: { id: number; status: string; estimated_minutes: number | null }[] = res.data;
          const target = orderId
            ? orders.find((o) => o.id === orderId)
            : orders[0];
          if (target) {
            setOrderStatus(target.status);
            if (target.estimated_minutes) setEstimatedMinutes(target.estimated_minutes);
          }
        } catch (err) {
          console.error("Error sincronizando estado de la orden:", err);
        }
      };
      syncFromDb();

      const pollInterval = setInterval(syncFromDb, 4000);
      return () => clearInterval(pollInterval);
    }
  }, [currentStep, isInitializing, user?.id, orderId]);

  useEffect(() => {
    if (currentStep !== 5 || !orderId) return;
    const socket = createSocket();
    socket.on('connect', () => {
      socket.emit('join_order', orderId);
    });
    socket.on('estado_actualizado', (updatedOrder: any) => {
      if (updatedOrder.id === orderId) {
        setOrderStatus(updatedOrder.status);
        if (updatedOrder.estimated_minutes) setEstimatedMinutes(updatedOrder.estimated_minutes);
      }
    });
    return () => {
      socket.disconnect();
    };
  }, [currentStep, orderId]);

  useEffect(() => {
    if (currentStep !== 5 || !user?.id) return;
    return subscribe((order) => {
      if (orderId && order.id !== orderId) return;
      setOrderStatus(order.status);
      if (order.estimated_minutes) setEstimatedMinutes(order.estimated_minutes);
    });
  }, [currentStep, user?.id, orderId, subscribe]);

  // Búsqueda predictiva con debounce de 350 ms, centrada en la tienda activa.
  useEffect(() => {
    if (currentStep !== 3) return;
    const query = addressQuery.trim();
    if (query.length < 3 || query === address.trim()) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const controller = new AbortController();
    const delayDebounceFn = setTimeout(async () => {
      setIsSearchingAddress(true);
      try {
        const res = await api.get('/geocode/autocomplete', {
          params: { q: query, slug },
          signal: controller.signal
        });
        if (controller.signal.aborted) return;
        setAddressSuggestions(Array.isArray(res.data?.results) ? res.data.results : []);
        setShowSuggestions(true);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Error buscando direcciones:', error);
        setAddressSuggestions([]);
        setShowSuggestions(false);
      } finally {
        if (!controller.signal.aborted) setIsSearchingAddress(false);
      }
    }, 350);

    return () => {
      clearTimeout(delayDebounceFn);
      controller.abort();
      setIsSearchingAddress(false);
    };
  }, [addressQuery, address, slug, currentStep]);

  const selectAddress = (suggestion: { display_name: string; latitude: number; longitude: number }) => {
    const cleanName = suggestion.display_name.replace(/, Venezuela$/i, '').trim();
    skipNextReverse.current = true;
    setAddressQuery(cleanName);
    setAddress(cleanName);
    setLatitude(Number(suggestion.latitude));
    setLongitude(Number(suggestion.longitude));
    setMapPosition([Number(suggestion.latitude), Number(suggestion.longitude)]);
    setShowSuggestions(false);
  };

  const selectSavedAddress = (saved: { address: string; address_details: string | null; latitude: number; longitude: number }) => {
    skipNextReverse.current = true;
    setAddressQuery(saved.address);
    setAddress(saved.address);
    if (saved.address_details) setAddressDetails(saved.address_details);
    setLatitude(Number(saved.latitude));
    setLongitude(Number(saved.longitude));
    setMapPosition([Number(saved.latitude), Number(saved.longitude)]);
    setShowSuggestions(false);
  };

  useEffect(() => {
    if (!token || currentStep !== 3) return;
    api.get('/orders/my-addresses')
      .then(res => setSavedAddresses(Array.isArray(res.data) ? res.data : []))
      .catch(() => setSavedAddresses([]));
  }, [token, currentStep]);

  useEffect(() => {
    if (currentStep !== 3 || !mapPosition) return;
    if (skipNextReverse.current) {
      skipNextReverse.current = false;
      return;
    }

    const [lat, lon] = mapPosition;
    const timer = setTimeout(async () => {
      setIsResolvingAddress(true);
      try {
        const res = await api.get('/geocode/reverse', { params: { latitude: lat, longitude: lon } });
        if (res.data?.display_name) {
          const cleanName = String(res.data.display_name).replace(/, Venezuela$/i, '').trim();
          setAddressQuery(cleanName);
          setAddress(cleanName);
        }
      } catch (error) {
        console.error('Error obteniendo la dirección del pin:', error);
      } finally {
        setIsResolvingAddress(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [mapPosition, currentStep]);

  const handleGPSLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Tu navegador o dispositivo no soporta geolocalización.");
      return;
    }

    setIsSearchingAddress(true);

    const applyPosition = (lat: number, lon: number) => {
      setLatitude(lat);
      setLongitude(lon);
      setMapPosition([lat, lon]);
    };

    const applyIpFallback = async (reason: string) => {
      toast.warning(`Usando ubicación aproximada (${reason}). Ajusta el pin en el mapa si es necesario.`);
      try {
        const ipRes = await fetch('https://ipapi.co/json/');
        const ipData = await ipRes.json();
        const lat = Number(ipData.latitude);
        const lon = Number(ipData.longitude);
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          applyPosition(lat, lon);
        }
      } catch (fallbackError) {
        console.error("El respaldo por IP falló", fallbackError);
      } finally {
        setIsSearchingAddress(false);
      }
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        applyPosition(position.coords.latitude, position.coords.longitude);
        setIsSearchingAddress(false);
        toast.success("Ubicación GPS obtenida. Verifica la dirección en el mapa.");
      },
      (error) => {
        console.warn("Error con GPS nativo:", error);

        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Permiso de ubicación denegado. Autoriza el GPS o busca tu dirección manualmente.");
          applyIpFallback("Permiso denegado");
        } else if (error.code === error.TIMEOUT) {
          applyIpFallback("La señal GPS tardó mucho");
        } else {
          applyIpFallback("GPS no disponible");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (mapPosition) {
      setLatitude(mapPosition[0]);
      setLongitude(mapPosition[1]);
    }
  }, [mapPosition]);

  useEffect(() => {
    if (cart.length === 0 && currentStep !== 5) {
      navigate(`/${slug}`);
    }
  }, [cart, navigate, slug, currentStep]);

  const requestOtp = async () => {
    if (!storeId) {
      toast.error('Cargando información de la tienda. Intenta de nuevo.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/check-email', { email, store_id: storeId });
      setIsRegistered(res.data.is_registered);
      if (res.data.user_name) setName(res.data.user_name);

      const registeredPhone = parsePhone(
        res.data.user_phone_country_code && res.data.user_phone_number
          ? `${res.data.user_phone_country_code}${res.data.user_phone_number}`
          : res.data.user_phone
      );
      if (registeredPhone.isValid) {
        setCountryCode(registeredPhone.countryCode);
        setRawPhone(registeredPhone.nationalNumber);
      } else if (res.data.user_phone) {
        setRawPhone(String(res.data.user_phone).replace(/\D/g, ''));
      }

      setStep(2);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || "Error al solicitar código");
    }
    setLoading(false);
  };

  const requestWhatsAppOtp = async () => {
    if (!storeId) {
      toast.error('Cargando información de la tienda. Intenta de nuevo.');
      return;
    }
    if (!parsedPhone.isValid) {
      toast.error('Por favor ingresa un número de teléfono válido con código de país.');
      return;
    }
    setLoading(true);
    try {
      const cleanWaDigits = parsedPhone.e164.replace(/\D/g, '');
      const res = await api.post('/auth/send-whatsapp-otp', {
        phone: parsedPhone.e164,
        store_id: storeId
      });
      const resolvedIdentifier = res.data.identifier || `wa_${cleanWaDigits}@whatsapp.user`;
      setWhatsAppIdentifier(resolvedIdentifier);

      if (res.data.code) {
        setOtp(res.data.code);
        setDemoOtpCode(res.data.code);
        toast.success(`⚡ Código OTP: ${res.data.code} (Autocompletado para tu prueba)`);
      } else {
        setDemoOtpCode('');
        toast.success("Código de verificación enviado a tu WhatsApp.");
      }

      const botPhone = String(res.data.bot_number || storeConfig?.bank_phone || '584161804831').replace(/\D/g, '');
      const waMsg = encodeURIComponent(`Hola, mi código de verificación para ${storeConfig?.name || 'la tienda'} es: ${res.data.code || ''}`);
      setWhatsAppFallbackLink(`https://wa.me/${botPhone}?text=${waMsg}`);
      setStep(2);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || "Error al solicitar código por WhatsApp");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (!storeId) {
      toast.error('Cargando información de la tienda. Intenta de nuevo.');
      return;
    }
    if (authChannel === 'WHATSAPP') {
      return requestWhatsAppOtp();
    }
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
    if (!storeId) {
      toast.error('Cargando información de la tienda. Intenta de nuevo.');
      return;
    }
    setLoading(true);
    try {
      const cleanWaDigits = parsedPhone.e164.replace(/\D/g, '');
      const targetEmail = authChannel === 'WHATSAPP'
        ? (whatsAppIdentifier || `wa_${cleanWaDigits}@whatsapp.user`)
        : email;
      const res = await api.post('/auth/verify-otp', {
        email: targetEmail,
        code: otp,
        store_id: storeId,
        name,
        phone: parsedPhone.isValid ? parsedPhone.e164 : phone
      });
      login(res.data.user);
      setStep(3);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || "Código incorrecto");
    } finally {
      setLoading(false);
    }
  };

  const confirmOrder = async () => {
    if (!storeId) {
      toast.error('Cargando información de la tienda. Intenta de nuevo.');
      return;
    }
    requestNotificationPermission();
    if (deliveryQuote?.in_range === false) {
      toast.error('Tu ubicación está fuera del rango de entrega de esta tienda.');
      return;
    }
    if (requiresPrescription && !prescriptionUrl) {
      toast.error('Debes adjuntar la fotografía de tu récipe médico para continuar.');
      return;
    }
    if (paymentMethod === 'TRANSFER' && ocrDetectedInfo?.amount && expectedVes > 0 && ocrDetectedInfo.amount < expectedVes * 0.98) {
      toast.error(`El comprobante adjunto registra Bs. ${ocrDetectedInfo.amount.toFixed(2)}, inferior al total del pedido (Bs. ${expectedVes.toFixed(2)}). Por favor adjunta un comprobante por el monto total.`);
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/orders/place', {
        store_id: storeId,
        items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity, unit_price: i.unit_price })),
        delivery_address: address,
        address_details: addressDetails || null,
        latitude: latitude,
        longitude: longitude,
        total_amount: grandTotal,
        payment_method: paymentMethod,
        payment_reference: paymentMethod === 'TRANSFER' ? paymentReference : `Efectivo en ${cashCurrency}`,
        payment_receipt_url: paymentMethod === 'TRANSFER' ? paymentReceiptUrl || null : null,
        prescription_url: requiresPrescription ? prescriptionUrl : null
      });
      
      if (res.data.estimated_minutes) {
        setEstimatedMinutes(res.data.estimated_minutes);
      }
      if (res.data.order_id) {
        setOrderId(res.data.order_id);
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
    switch (currentStep) {
      case 1:
        return (
          <Card className="border-none shadow-2xl backdrop-blur-xl bg-white/90">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30 transform rotate-3 hover:rotate-0 transition-transform">
                <UserIcon className="text-white" size={36} />
              </div>
              <CardTitle className="text-3xl font-black text-gray-900 tracking-tight">Acceso Rápido</CardTitle>
              <CardDescription className="text-base mt-2">Inicia sesión de forma segura y sin contraseñas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              {/* F2G-06: Selector de Canal Dual (Correo o WhatsApp) */}
              <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setAuthChannel('EMAIL')}
                  className={`py-2.5 text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 ${authChannel === 'EMAIL' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  <Mail size={16} /> Correo
                </button>
                <button
                  type="button"
                  onClick={() => setAuthChannel('WHATSAPP')}
                  className={`py-2.5 text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 ${authChannel === 'WHATSAPP' ? 'bg-white text-emerald-600 shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  <MessageSquare size={16} /> WhatsApp
                </button>
              </div>

              {authChannel === 'EMAIL' ? (
                <>
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
                    {loading ? 'Cargando...' : 'Recibir Código por Correo'} <ChevronRight className="ml-2" />
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                      <label className="text-xs font-black text-emerald-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Phone size={14} /> Tu WhatsApp (con código de país)
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="h-14 px-2 text-base font-bold rounded-xl border border-emerald-200 transition-all bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 cursor-pointer outline-none"
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
                          placeholder="Ej: 4121234567" 
                          value={rawPhone} 
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                            setRawPhone(val);
                          }}
                          className="flex-1 min-w-0 h-14 text-lg rounded-xl transition-all bg-white focus:border-emerald-500 focus:ring-emerald-500 font-bold"
                        />
                      </div>
                    </div>
                  </div>
                  <Button onClick={requestWhatsAppOtp} className="w-full h-16 text-lg rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 shadow-xl shadow-emerald-500/20 font-black text-white transition-all transform hover:scale-[1.02]" disabled={!parsedPhone.isValid || loading}>
                    {loading ? 'Enviando...' : 'Recibir Código por WhatsApp'} <ChevronRight className="ml-2" />
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        );
      case 2:
        return (
          <Card className="border-none shadow-2xl backdrop-blur-xl bg-white/90 animate-in fade-in slide-in-from-right-8 duration-500">
            <CardHeader className="text-center pb-2">
              <div className={`mx-auto w-20 h-20 bg-gradient-to-br ${authChannel === 'WHATSAPP' ? 'from-emerald-400 to-emerald-600 shadow-emerald-500/30' : 'from-orange-400 to-orange-600 shadow-primary/30'} rounded-2xl flex items-center justify-center mb-6 shadow-lg transform -rotate-3 hover:rotate-0 transition-transform`}>
                <ShieldCheck className="text-white" size={36} />
              </div>
              <CardTitle className="text-3xl font-black text-gray-900 tracking-tight">
                {authChannel === 'WHATSAPP' ? 'Validación por WhatsApp' : 'Verificación Segura'}
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {authChannel === 'WHATSAPP'
                  ? `Hemos enviado un código de 6 dígitos a tu WhatsApp (${parsedPhone.e164})`
                  : `Hemos enviado un código a tu correo (${email})`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              {authChannel === 'WHATSAPP' && demoOtpCode && (
                <div className="bg-emerald-50/90 border-2 border-emerald-300 rounded-2xl p-4 text-emerald-950 shadow-sm space-y-2 text-left">
                  <div className="flex items-center gap-2 font-black text-sm text-emerald-800">
                    <Sparkles size={16} className="text-emerald-600 flex-shrink-0" />
                    <span>⚡ Modo Demostración / Pruebas Online</span>
                  </div>
                  <p className="text-xs text-emerald-900 leading-relaxed">
                    Tu código de verificación es: <span className="font-mono font-black text-base text-emerald-800 tracking-wider bg-white px-2 py-0.5 rounded-lg border border-emerald-300 shadow-xs">{demoOtpCode}</span>.
                    Ha sido cargado automáticamente en el campo inferior para que puedas validar la compra de inmediato.
                  </p>
                  <p className="text-[11px] text-emerald-700 font-medium">
                    (En el servidor VPS con Evolution API, este código se enviará directamente y de forma privada al WhatsApp del cliente desde la línea oficial <strong>+58 4161804831</strong>).
                  </p>
                </div>
              )}

              <div className="mb-4 bg-primary/5 p-4 rounded-2xl border border-primary/20">
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

              {authChannel === 'EMAIL' && (
                <div className="mb-4 bg-primary/5 p-4 rounded-2xl border border-primary/20">
                  <label className="text-sm font-bold text-orange-900 mb-2 flex items-center gap-2">
                    <Phone size={16} /> {isRegistered && rawPhone ? 'Tu teléfono registrado (puedes corregirlo)' : 'Número de Teléfono (Para el delivery)'}
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="h-14 px-2 text-lg font-bold rounded-xl border border-primary/30 transition-all bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500 cursor-pointer outline-none"
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
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                        setRawPhone(val);
                      }}
                      className="flex-1 min-w-0 h-14 text-lg rounded-xl transition-all bg-white focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                </div>
              )}
              
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

              <Button onClick={verifyOtp} className="w-full h-16 text-lg rounded-2xl bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 shadow-xl shadow-primary/20 font-black text-white transition-all transform hover:scale-[1.02]" disabled={otp.length < 6 || ((!isRegistered || !name) && name.length < 3) || !parsedPhone.isValid || loading}>
                {loading ? 'Verificando...' : 'Validar y Continuar'} <ChevronRight className="ml-2" />
              </Button>
              
              <div className="text-center mt-4 space-y-2">
                <Button variant="link" onClick={resendOtp} disabled={loading} className="text-primary font-bold hover:text-primary">
                  ¿No recibiste el código? Reenviar
                </Button>
                {authChannel === 'WHATSAPP' && (
                  <div className="pt-1">
                    <a
                      href={whatsAppFallbackLink || 'https://wa.me/584161804831'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-black text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl border border-emerald-200 transition-all shadow-xs"
                    >
                      <MessageSquare size={14} className="text-emerald-600" /> WhatsApp Oficial de Soporte (+58 4161804831)
                    </a>
                  </div>
                )}
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
                  <MapPin className="text-primary"/>
                </div> 
                ¿A dónde enviamos?
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-8 space-y-5 sm:space-y-6">
              <div className="space-y-3 relative z-20">
                <label className="text-sm font-bold text-gray-700 block">Busca tu dirección de entrega</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-[18px] text-orange-500" size={20} />
                  <Input 
                    placeholder="Ej: Sector 57, casa 12..."
                    value={addressQuery} 
                    onChange={(e) => {
                      setAddressQuery(e.target.value);
                      if (e.target.value.trim() !== address.trim()) setAddress('');
                    }}
                    onFocus={() => { if(addressSuggestions.length > 0) setShowSuggestions(true); }}
                    className="h-14 pl-12 rounded-xl text-lg bg-gray-50 focus:bg-white transition-colors"
                  />
                  {(isSearchingAddress || isResolvingAddress) && <div className="absolute right-4 top-[18px] w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>}
                </div>

                <Button 
                  variant="outline" 
                  onClick={handleGPSLocation}
                  disabled={isSearchingAddress}
                  className="w-full flex items-center justify-center gap-2 text-primary border-primary/30 hover:bg-primary/10 h-12 rounded-xl mt-2 font-bold"
                >
                  <LocateFixed size={18} /> 
                  {isSearchingAddress ? 'Ubicando...' : 'Ubicar mi casa por GPS'}
                </Button>

                {showSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute z-[1000] w-full bg-white border border-gray-200 shadow-2xl rounded-xl mt-1 overflow-hidden max-h-60 overflow-y-auto">
                    {addressSuggestions.map((sug, i) => (
                      <div 
                        key={sug.place_id || i}
                        className="p-4 hover:bg-primary/10 cursor-pointer border-b border-gray-100 last:border-0 text-sm text-gray-700 flex items-start gap-2"
                        onClick={() => selectAddress(sug)}
                      >
                        <MapPin size={16} className="text-orange-400 mt-0.5 flex-shrink-0" />
                        <span>{sug.display_name.replace(/, Venezuela$/i, '')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {savedAddresses.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                    <Navigation size={13} /> Direcciones anteriores
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {savedAddresses.map((saved, index) => (
                      <button
                        key={`${saved.latitude}-${saved.longitude}-${index}`}
                        type="button"
                        onClick={() => selectSavedAddress(saved)}
                        className="inline-flex items-center gap-1.5 max-w-full rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
                      >
                        {index === 0 ? <Home size={13} /> : <Briefcase size={13} />}
                        <span className="truncate max-w-[220px]">{saved.address}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mapa Interactivo */}
              <div className="space-y-2 relative rounded-2xl overflow-hidden border border-gray-200 shadow-inner h-64 z-0">
                <MapContainer key={`${mapCenter[0]}-${mapCenter[1]}`} center={mapCenter} zoom={15} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationMarker position={mapPosition} setPosition={setMapPosition} />
                </MapContainer>
                <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm p-2 rounded-xl text-xs text-center text-gray-600 font-medium z-[400] shadow-sm pointer-events-none border border-gray-100">
                  Toca el mapa o arrastra el pin para ajustar la ubicación exacta
                </div>
              </div>

              {deliveryQuote?.in_range === false && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                  <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-black text-sm">Tu ubicación está fuera del rango de entrega de esta tienda.</p>
                    <p className="text-xs mt-1">
                      {deliveryQuote.coverage?.max_distance_km
                        ? `La cobertura máxima es de ${deliveryQuote.coverage.max_distance_km} km. `
                        : ''}
                      Mueve el pin o busca una dirección más cercana para continuar.
                    </p>
                  </div>
                </div>
              )}

              {deliveryQuote?.in_range !== false && deliveryQuote?.distance_km !== null && deliveryQuote?.distance_km !== undefined && (
                <div className="rounded-2xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 text-emerald-950 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-black text-sm">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <Navigation size={15} />
                      </div>
                      <div>
                        <span>{deliveryQuote.zone_name ? `Zona: ${deliveryQuote.zone_name}` : 'Tarifa por Distancia'}</span>
                        <span className="block text-[11px] text-emerald-700 font-semibold">
                          Calculado según tu ubicación en el mapa
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-lg text-emerald-800 tracking-tight">{formatPrice(deliveryFee, storeConfig?.currency)}</p>
                      {storeConfig && storeConfig.currency !== 'VES' && storeConfig.ves_rate && (
                        <p className="text-[11px] font-black text-emerald-700">
                          Bs. {(deliveryFee * Number(storeConfig.ves_rate)).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-800 pt-2 border-t border-emerald-200/80">
                    <span>📏 Distancia al local: {deliveryQuote.distance_km} km</span>
                    {deliveryQuote.estimated_minutes && (
                      <span>⏱️ Tiempo estimado: ~{deliveryQuote.estimated_minutes} min</span>
                    )}
                  </div>
                </div>
              )}

              {address && (
                <div className="space-y-3 bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 animate-in fade-in slide-in-from-top-4">
                  <label className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-500" /> Dirección confirmada
                  </label>
                  <p className="text-xs text-emerald-700 mb-2">Añade detalles específicos (piso, casa, apartamento, referencias):</p>
                  <Input 
                    placeholder="Ej: Casa amarilla portón negro, al lado de la panadería..." 
                    value={addressDetails} 
                    onChange={(e) => setAddressDetails(e.target.value)}
                    className="h-12 rounded-xl bg-white border-emerald-200 focus:border-emerald-500"
                  />
                </div>
              )}

              <Button
                onClick={() => setStep(4)}
                className="w-full h-16 text-lg rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 hover:from-black hover:to-gray-900 shadow-xl shadow-gray-900/20 font-black text-white transition-all transform hover:scale-[1.02]"
                disabled={!address || isResolvingAddress || deliveryQuote?.in_range === false}
              >
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
            <CardContent className="p-5 sm:p-8 space-y-5 sm:space-y-8">

              {(storeConfig?.industry?.toUpperCase() === 'PHARMACY' || storeConfig?.industry?.toUpperCase() === 'FARMACIA') && requiresPrescription && (
                <div className="p-5 rounded-2xl border-2 border-amber-200 bg-amber-50/60 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📋</span>
                    <span className="font-black text-amber-950 text-sm">
                      {cart.some(i => i.prescription_type === 'RETAIN_ORIGINAL')
                        ? 'Retención Legal de Récipe Médico Original'
                        : 'Verificación de Récipe Médico'}
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    {cart.some(i => i.prescription_type === 'RETAIN_ORIGINAL')
                      ? '⚠️ Atención: Este pedido incluye medicamentos de control especial. El motorizado retendrá físicamente tu récipe original en papel para el archivo legal de la farmacia. Adjunta la foto para que el farmaceuta lo pre-apruebe antes de despachar.'
                      : '📄 Uno o más medicamentos requieren récipe médico. Por favor adjunta la foto para agilizar la preparación y ten el récipe en mano para mostrárselo al motorizado al momento de la entrega.'}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 items-center pt-1">
                    <Input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingPrescription}
                      onChange={handlePrescriptionUpload}
                      className="bg-white border-amber-300 text-xs file:bg-amber-100 file:text-amber-800 file:border-0 file:rounded-lg file:font-semibold"
                    />
                    {prescriptionUrl && (
                      <a href={prescriptionUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-emerald-700 underline whitespace-nowrap">
                        Ver récipe adjunto ✓
                      </a>
                    )}
                  </div>
                  {isUploadingPrescription && <p className="text-xs text-amber-700 animate-pulse">Subiendo fotografía del récipe...</p>}
                </div>
              )}

              <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-emerald-50/30 border border-emerald-100 p-5 space-y-3 text-sm shadow-sm">
                <div className="flex justify-between text-gray-700">
                  <span className="font-medium">Productos ({cart.reduce((a, b) => a + b.quantity, 0)})</span>
                  <div className="text-right">
                    <span className="font-bold">{formatPrice(total, storeConfig?.currency)}</span>
                    {storeConfig && storeConfig.currency !== 'VES' && storeConfig.ves_rate && (
                      <span className="block text-[11px] text-muted-foreground">
                        Bs. {(total * Number(storeConfig.ves_rate)).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-start text-gray-700 pt-1">
                  <div>
                    <span className="font-bold flex items-center gap-1.5 text-gray-900">
                      🛵 Envío / Delivery
                    </span>
                    <span className="text-xs text-emerald-700 font-semibold block">
                      {deliveryQuote?.zone_name ? `Zona: ${deliveryQuote.zone_name}` : 'Tarifa calculada por distancia'}
                      {deliveryQuote?.distance_km ? ` (${deliveryQuote.distance_km} km)` : ''}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-800">{formatPrice(deliveryFee, storeConfig?.currency)}</span>
                    {storeConfig && storeConfig.currency !== 'VES' && storeConfig.ves_rate && (
                      <span className="block text-[11px] text-emerald-700 font-semibold">
                        Bs. {(deliveryFee * Number(storeConfig.ves_rate)).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-200/80 pt-3 flex justify-between items-baseline">
                  <div>
                    <span className="text-base font-black text-gray-900 block">Total a Pagar</span>
                    {storeConfig && storeConfig.currency !== 'VES' && storeConfig.ves_rate && (
                      <span className="text-xs font-semibold text-gray-500">
                        Tasa BCV: {Number(storeConfig.ves_rate).toFixed(2)} Bs/$
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-emerald-600 block tracking-tight">
                      {formatPrice(grandTotal, storeConfig?.currency)}
                    </span>
                    {storeConfig && storeConfig.currency !== 'VES' && storeConfig.ves_rate && (
                      <span className="text-xs font-black text-gray-800 bg-emerald-100/70 px-2 py-0.5 rounded-md inline-block mt-0.5">
                        Total en Bs: {(grandTotal * Number(storeConfig.ves_rate)).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

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
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {['USD', 'VES', 'COP'].map(curr => (
                      <div 
                        key={curr}
                        onClick={() => setCashCurrency(curr)}
                        className={`py-3 px-1 rounded-xl border-2 text-center cursor-pointer font-black text-xs sm:text-sm leading-tight flex items-center justify-center transition-all ${
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
                      {cashCurrency === storeConfig?.currency ? formatPrice(grandTotal, cashCurrency) : getConversions(grandTotal, storeConfig)?.[cashCurrency]}
                    </strong>
                  </div>
                </div>
              )}

              {paymentMethod === 'TRANSFER' && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl border border-gray-200 shadow-inner space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                  <p className="text-sm font-black text-gray-800 uppercase tracking-wider">Datos de Transferencia:</p>
                  <div className="text-sm text-gray-700 bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2">
                    {storeConfig?.bank_name || storeConfig?.bank_phone || storeConfig?.bank_id_number ? (
                      <>
                        {storeConfig?.bank_name && (
                          <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-500">Banco:</span>
                            <strong className="font-black">
                              {storeConfig.bank_code ? `${storeConfig.bank_code} - ` : ''}{storeConfig.bank_name}
                            </strong>
                          </div>
                        )}
                        {storeConfig?.bank_phone && (
                          <div className="flex justify-between border-b pb-2 pt-1">
                            <span className="text-gray-500">Teléfono:</span>
                            <strong className="font-black">{storeConfig.bank_phone}</strong>
                          </div>
                        )}
                        {storeConfig?.bank_id_number && (
                          <div className="flex justify-between border-b pb-2 pt-1">
                            <span className="text-gray-500">Cédula/RIF:</span>
                            <strong className="font-black">{storeConfig.bank_id_number}</strong>
                          </div>
                        )}
                        {storeConfig?.bank_holder && (
                          <div className="flex justify-between border-b pb-2 pt-1">
                            <span className="text-gray-500">Titular:</span>
                            <strong className="font-black">{storeConfig.bank_holder}</strong>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-600">
                        El comercio te confirmará los datos de pago al procesar tu pedido.
                      </p>
                    )}
                    <div className="flex justify-between pt-2 items-center">
                      <span className="text-gray-500">Monto:</span> 
                      <div className="text-right">
                        <strong className="text-xl text-emerald-600 font-black">{formatPrice(grandTotal, storeConfig?.currency)}</strong>
                        {storeConfig && storeConfig.currency !== 'VES' && (
                          <div className="text-xs font-bold text-gray-500 mt-1">
                            Equivalente: {getConversions(grandTotal, storeConfig)?.VES}
                          </div>
                        )}
                        {storeConfig && storeConfig.currency !== 'COP' && (
                          <div className="text-xs font-bold text-gray-500">
                            Equivalente: {getConversions(grandTotal, storeConfig)?.COP}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {storeConfig?.payment_note && (
                    <p className="text-xs font-semibold text-gray-600 bg-white/60 p-3 rounded-xl border border-gray-200">
                      {storeConfig.payment_note}
                    </p>
                  )}
                  {/* F2G-04 y F2G-05: Subida de Capture con Extracción Asistida */}
                  <div className="p-4 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                        <Camera size={16} className="text-blue-600" />
                        Comprobante / Capture de Pago Móvil
                      </span>
                      {paymentReceiptUrl && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 size={12} /> Capture listo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-blue-800 leading-relaxed">
                      Sube la captura de pantalla de tu transferencia. El sistema leerá automáticamente el número de referencia para que no tengas que escribirlo.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 items-center pt-1">
                      <label className="w-full sm:w-auto flex-1 cursor-pointer">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          disabled={isUploadingReceipt}
                          onChange={handleReceiptUpload}
                          className="hidden"
                        />
                        <div className="h-12 px-4 rounded-xl border border-blue-300 bg-white hover:bg-blue-50/50 text-blue-700 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm">
                          <Upload size={16} />
                          {paymentReceiptUrl ? 'Cambiar imagen del comprobante' : 'Seleccionar o Tomar Foto del Capture'}
                        </div>
                      </label>
                      {paymentReceiptUrl && (
                        <a
                          href={paymentReceiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-blue-700 hover:text-blue-900 underline whitespace-nowrap"
                        >
                          Ver comprobante cargado ↗
                        </a>
                      )}
                    </div>

                    {isUploadingReceipt && (
                      <p className="text-xs text-blue-700 animate-pulse font-bold flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                        Subiendo comprobante y detectando número de referencia con OCR...
                      </p>
                    )}

                    {paymentReceiptUrl && (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-blue-200">
                          <img
                            src={paymentReceiptUrl}
                            alt="Capture cargado"
                            className="w-14 h-14 object-cover rounded-lg border border-gray-200"
                          />
                          <div className="text-left text-xs">
                            <p className="font-bold text-gray-900">Comprobante adjunto correctamente</p>
                            <p className="text-gray-500 text-[11px]">
                              {ocrDetectedInfo?.reference
                                ? `Referencia detectada: ${ocrDetectedInfo.reference}`
                                : 'Revisa y confirma la referencia abajo.'}
                            </p>
                          </div>
                        </div>

                        {ocrDetectedInfo?.amount && expectedVes > 0 && (
                          ocrDetectedInfo.amount < expectedVes * 0.98 ? (
                            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs space-y-1 text-left">
                              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                                <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                                <span>Monto insuficiente detectado en comprobante</span>
                              </div>
                              <p className="text-amber-800 leading-relaxed">
                                El comprobante indica <strong>Bs. {ocrDetectedInfo.amount.toFixed(2)}</strong>, pero el total de tu pedido es <strong>Bs. {expectedVes.toFixed(2)}</strong>. Por favor verifica tu pago o adjunta el capture con el pago completo para continuar.
                              </p>
                            </div>
                          ) : (
                            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs space-y-1 text-left">
                              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                                <span>Monto verificado: Bs. {ocrDetectedInfo.amount.toFixed(2)}</span>
                              </div>
                              <p className="text-emerald-800">
                                Cubre el total del pedido (Total: Bs. {expectedVes.toFixed(2)}).
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
                      Número de Referencia Bancaria (4 a 10 dígitos)
                    </label>
                    <Input 
                      placeholder="Ej: 00481927" 
                      value={paymentReference} 
                      onChange={(e) => setPaymentReference(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="h-14 rounded-xl font-bold tracking-widest text-center text-lg bg-white border-2 border-gray-200 focus:border-blue-500"
                      maxLength={10}
                      inputMode="numeric"
                    />
                  </div>
                  {paymentReference.length > 0 && !isTransferReferenceValid && (
                    <p className="text-xs font-bold text-red-600 text-center">
                      La referencia debe tener entre 4 y 10 dígitos.
                    </p>
                  )}
                </div>
              )}

              <Button 
                onClick={confirmOrder} 
                className={`w-full h-16 text-lg rounded-2xl font-black text-white transition-all transform shadow-xl ${!paymentMethod || (paymentMethod === 'TRANSFER' && !isTransferReferenceValid) || loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:scale-[1.02] hover:shadow-primary/30'}`}
                disabled={!paymentMethod || (paymentMethod === 'TRANSFER' && !isTransferReferenceValid) || loading}
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
                <div className="mt-4 bg-orange-100/80 text-primary p-4 rounded-2xl font-black border border-primary/30 text-lg shadow-sm">
                  ⏳ Llegada Estimada: ~{estimatedMinutes} mins
                </div>
              ) : (
                <CardDescription className="text-primary font-bold mt-2 animate-pulse">
                  {orderStatus === 'AWAITING_PAYMENT' ? 'Validando tu pago móvil...' : 'Actualización en tiempo real...'}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="p-5 sm:p-8 sm:px-10">
              <NotificationPermissionBanner role="customer" className="mb-6" />
              <div className="relative border-l-4 border-gray-100 ml-6 space-y-10">
                {timeline.map((item, index) => {
                  const isCompleted = index <= currentIndex;
                  const isActive = index === currentIndex;
                  
                  return (
                    <div key={item.status} className={`relative pl-8 sm:pl-10 transition-all duration-700 ${isCompleted ? 'opacity-100 transform translate-x-0' : 'opacity-40 transform translate-x-2'}`}>
                      {/* Círculo indicador con icono */}
                      <div className={`absolute -left-[26px] top-0 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg transition-all duration-500 ${
                        isActive ? 'bg-primary text-white shadow-primary/40 animate-bounce' : 
                        isCompleted ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400 grayscale'
                      }`}>
                        {item.icon}
                      </div>
                      
                      <div className="flex flex-col pt-1">
                        <h3 className={`font-black text-xl transition-colors ${isActive ? 'text-primary' : 'text-gray-900'}`}>
                          {item.title}
                        </h3>
                        <p className="text-gray-500 font-medium text-sm mt-1">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {(() => {
                const isRestaurant = storeConfig?.industry === 'RESTAURANT';
                const canModifyOrCancel = isRestaurant
                  ? ['PENDING', 'AWAITING_PAYMENT', 'ACCEPTED'].includes(orderStatus)
                  : ['PENDING', 'AWAITING_PAYMENT', 'ACCEPTED', 'PREPARING'].includes(orderStatus);

                if (!canModifyOrCancel) return null;

                return (
                  <div className="mt-8 pt-6 border-t border-gray-100 space-y-3">
                    <p className="text-xs text-center text-gray-500 font-semibold">
                      {isRestaurant
                        ? '¿Deseas cambiar algo? Puedes modificar productos o cancelar tu pedido antes de que inicie la preparación en cocina.'
                        : '¿Deseas cambiar algo? Puedes modificar productos o cancelar tu pedido antes de que sea entregado al repartidor.'}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex-1 h-12 rounded-2xl font-black border-amber-300 bg-amber-50/50 text-amber-900 hover:bg-amber-100"
                      >
                        <Edit3 size={16} className="mr-2 text-amber-700" /> Modificar Pedido
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCancelModalOpen(true)}
                        className="flex-1 h-12 rounded-2xl font-black border-red-200 bg-red-50/50 text-red-600 hover:bg-red-100"
                      >
                        <XCircle size={16} className="mr-2 text-red-600" /> Cancelar Pedido
                      </Button>
                    </div>
                  </div>
                );
              })()}

              {orderStatus === 'CANCELLED' && (
                <div className="mt-8 p-5 bg-red-50 border border-red-200 rounded-2xl text-center space-y-3">
                  <p className="font-black text-red-700 text-sm">Este pedido fue cancelado.</p>
                  <Button onClick={() => navigate(`/${slug}`)} className="w-full h-12 rounded-xl font-black bg-red-600 hover:bg-red-700 text-white">
                    Volver a la tienda
                  </Button>
                </div>
              )}

              <CancelOrderModal
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                onConfirm={async (reason: string) => {
                  if (!orderId) return;
                  await api.put(`/orders/${orderId}/cancel`, { cancel_reason: reason });
                  setOrderStatus('CANCELLED');
                  toast.success('Pedido cancelado exitosamente');
                }}
                orderId={orderId || 0}
              />

              <EditOrderModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={async (items: any[]) => {
                  if (!orderId) return;
                  const res = await api.put(`/orders/${orderId}/items`, { items, cancel_reason: 'Productos modificados por el cliente' });
                  setPlacedOrderItems(res.data.order.items || items);
                  toast.success('¡Pedido modificado con éxito!');
                }}
                orderId={orderId || 0}
                currency={storeConfig?.currency}
                initialItems={placedOrderItems}
              />

              {orderStatus === 'DELIVERED' && (
                <div className="mt-12 pt-8 border-t border-gray-100 animate-in slide-in-from-bottom-8 duration-700">
                  <Button onClick={() => navigate(`/${slug}`)} className="w-full h-16 text-lg rounded-2xl font-black bg-gradient-to-r from-orange-500 to-orange-600 shadow-xl shadow-primary/20 text-white hover:scale-[1.02] transition-transform">
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

  if (storeError) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 bg-gray-50">
        <Card className="max-w-md w-full text-center p-8 border border-gray-200 shadow-xl rounded-3xl bg-white">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Tienda no disponible</h2>
          <p className="text-gray-500 text-sm mb-6">
            {storeError}
          </p>
          <Button onClick={() => navigate('/')} className="w-full rounded-2xl font-black h-12 bg-primary text-white">
            Volver al Inicio
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 pt-10 pb-20 min-h-[80vh] flex flex-col justify-center bg-gray-50">
      <div className="max-w-md mx-auto w-full">
        {currentStep < 5 && (
          <div className="flex justify-between items-center mb-10 px-4 relative">
            <div className="absolute left-8 right-8 h-1.5 bg-gray-200 top-4 -z-10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500" 
                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
              ></div>
            </div>
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all duration-500 ${currentStep >= s ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110' : 'bg-white text-gray-400 border-2 border-gray-200'}`}>
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
