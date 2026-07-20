import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import api from '../api';
import { Clock, MapPin, Phone, Truck, CheckCircle, Check, ArrowLeft, XCircle } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { formatPrice } from '../utils/currency';

interface OrderItem {
  id: number;
  quantity: number;
  unit_price: number;
  product: {
    name: string;
  };
}

interface Order {
  id: number;
  delivery_address: string;
  latitude: number | null;
  longitude: number | null;
  total_amount: number;
  payment_method: string;
  payment_reference: string | null;
  status: string;
  cancel_reason?: string | null;
  distance_km?: number | null;
  estimated_minutes?: number | null;
  createdAt: string;
  items: OrderItem[];
  user: {
    id: number;
    name: string | null;
    phone: string;
  };
  store_id?: number;
}

const OrderRouteMap = ({ order, storeLocation }: { order: Order, storeLocation: [number, number] }) => {
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);

  useEffect(() => {
    if (order.latitude && order.longitude && storeLocation[0]) {
      const fetchRoute = async () => {
        try {
          const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${storeLocation[1]},${storeLocation[0]};${order.longitude},${order.latitude}?overview=full&geometries=geojson`);
          const data = await res.json();
          if (data.routes && data.routes[0]) {
            const coords = data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
            setRouteCoords(coords);
          }
        } catch (e) {
          console.error("Error cargando ruta", e);
        }
      };
      fetchRoute();
    }
  }, [order, storeLocation]);

  if (!order.latitude || !order.longitude) return null;
  const customerLoc: [number, number] = [order.latitude, order.longitude];

  return (
    <div className="h-[250px] sm:h-[300px] w-full rounded-xl overflow-hidden mt-4 border border-border shadow-inner relative z-0">
      <MapContainer center={storeLocation} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
        <Marker position={storeLocation} />
        <Marker position={customerLoc} />
        {routeCoords.length > 0 ? (
          <Polyline positions={routeCoords} color="#3b82f6" weight={5} opacity={0.8} />
        ) : (
          <Polyline positions={[storeLocation, customerLoc]} color="#94a3b8" dashArray="5, 10" weight={3} />
        )}
      </MapContainer>
    </div>
  );
};

export default function OrderDetails() {
  const { slug, orderId } = useParams<{ slug: string, orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [storeData, setStoreData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const storeRes = await api.get(`/stores/${slug}/products`);
        setStoreData(storeRes.data.store);
        
        const orderRes = await api.get(`/orders/${orderId}`);
        setOrder(orderRes.data);
      } catch (error) {
        console.error("Error obteniendo detalles", error);
      } finally {
        setLoading(false);
      }
    };
    if (orderId && slug) {
      fetchData();
    }
  }, [slug, orderId]);

  useEffect(() => {
    if (!storeData) return;

    const socket: Socket = io('http://localhost:3000');
    socket.on('connect', () => {
      // @ts-expect-error storeData is loosely typed
      socket.emit('join_store', storeData.id);
    });

    socket.on('pedido_actualizado', (updatedOrder: Order) => {
      if (updatedOrder.id === Number(orderId)) {
        setOrder(updatedOrder);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [storeData, orderId]);

  const changeStatus = async (newStatus: string) => {
    if (!order) return;
    const payload: { status: string; cancel_reason?: string } = { status: newStatus };

    if (newStatus === 'CANCELLED') {
      const reason = window.prompt("¿Por qué deseas rechazar/cancelar este pedido?");
      if (reason === null) return;
      if (reason.trim() !== "") {
        payload.cancel_reason = reason;
      }
    }

    try {
      await api.put(`/orders/${order.id}/status`, payload);
      // Actualizar localmente para sentirlo instantáneo
      setOrder({ ...order, status: newStatus, cancel_reason: payload.cancel_reason || order.cancel_reason });
    } catch (error) {
      console.error("Error actualizando pedido", error);
      alert("No se pudo actualizar el estado.");
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center font-bold text-muted-foreground">Cargando pedido...</div>;
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <h2 className="text-2xl font-black">Pedido no encontrado</h2>
        <Button onClick={() => navigate(`/admin/${slug}`)}>Volver al Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28 md:pb-32 font-sans animate-in fade-in duration-300">
      
      {/* Encabezado Fijo */}
      <div className="bg-white p-4 md:p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center sticky top-0 z-20 shadow-sm gap-4">
        <div className="flex items-center gap-3 md:gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(`/admin/${slug}`)} className="h-10 w-10 md:h-12 md:w-12 rounded-full hover:bg-gray-100 flex-shrink-0">
            <ArrowLeft className="h-5 w-5 md:h-6 md:w-6 text-gray-700" />
          </Button>
          <div>
            <h2 className="font-black text-2xl md:text-3xl tracking-tight text-gray-900">Pedido #{order.id}</h2>
            <p className="text-xs md:text-sm font-bold text-gray-500 mt-0.5 flex items-center gap-1.5">
              <Clock size={14}/> {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <Badge className={`px-4 py-1.5 md:py-2 font-black text-xs md:text-sm rounded-lg shadow-sm border-0 self-start md:self-auto ${order.status === 'PENDING' ? 'bg-orange-100 text-orange-700' : order.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-700' : order.status === 'DISPATCHED' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
          {order.status === 'PENDING' ? 'NUEVA ÓRDEN' : order.status === 'ACCEPTED' ? 'PREPARANDO' : order.status === 'DISPATCHED' ? 'EN CAMINO' : 'ENTREGADO'}
        </Badge>
      </div>

      {/* Contenido */}
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4 md:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Cliente */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">Cliente</p>
            <p className="font-black text-xl text-gray-900">{order.user.name || 'Sin Nombre'}</p>
            <p className="font-semibold text-gray-600 flex items-center gap-2 mt-1.5">
              <Phone size={16} className="text-primary"/> 
              <a href={`tel:${order.user.phone}`} className="hover:underline">{order.user.phone}</a>
            </p>
          </div>
          
          {/* Pago */}
          <div className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between ${order.payment_method === 'CASH' ? 'border-emerald-200 bg-emerald-50' : 'border-blue-200 bg-blue-50'}`}>
             <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pago y Facturación</p>
             <div className="flex justify-between items-end mt-2">
               <div>
                 <p className={`font-black flex items-center gap-1.5 text-base md:text-lg ${order.payment_method === 'CASH' ? 'text-emerald-700' : 'text-blue-700'}`}>
                   {order.payment_method === 'CASH' ? '💵 Efectivo' : '📱 Pago Móvil'}
                 </p>
               </div>
               <p className="text-3xl md:text-4xl font-black tracking-tighter text-gray-900 leading-none">{formatPrice(order.total_amount, (storeData as any)?.currency)}</p>
             </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
          {/* Dirección y Ruta */}
          <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-sm lg:col-span-3">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1"><MapPin size={14}/> Dirección de Entrega</p>
            <p className="font-medium text-gray-800 leading-snug">{order.delivery_address.split(' | Link GMaps:')[0]}</p>
            
            {order.latitude && order.longitude && storeData?.latitude ? (
              <div className="mt-5 pt-5 border-t border-gray-100">
                <div className="flex justify-between items-center bg-gray-50 p-3 md:p-4 rounded-xl border border-gray-100">
                  <div>
                    <p className="text-[10px] md:text-[11px] font-bold uppercase text-gray-500 tracking-wider">Distancia Estimada</p>
                    <p className="font-black text-lg md:text-xl text-gray-900">{order.distance_km?.toFixed(2)} km</p>
                  </div>
                  <div>
                    <p className="text-[10px] md:text-[11px] font-bold uppercase text-gray-500 text-right tracking-wider">Llegada Aprox.</p>
                    <p className="font-black text-orange-600 text-lg md:text-xl text-right">{order.estimated_minutes} mins</p>
                  </div>
                </div>
                
                {/* @ts-expect-error storeData lat/lng are loosely typed */}
                <OrderRouteMap order={order} storeLocation={[Number(storeData.latitude), Number(storeData.longitude)]} />
                
                <a 
                  // @ts-expect-error storeData lat/lng
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Hola! Nuevo pedido para entregar.\n\n👤 *Cliente:* ${order.user.name || 'Sin nombre'}\n📞 *Teléfono:* ${order.user.phone}\n🏠 *Dirección:* ${order.delivery_address.split(' | Link GMaps:')[0]}\n\n📍 *Iniciar Navegación GPS:*\nhttps://www.google.com/maps/dir/?api=1&origin=${storeData.latitude},${storeData.longitude}&destination=${order.latitude},${order.longitude}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1da851] text-white p-3.5 md:p-4 rounded-xl font-black mt-4 transition-transform hover:scale-[1.02] shadow-xl shadow-green-500/20 text-base md:text-lg"
                >
                  <Truck size={22} /> Enviar Ruta al Motorizado
                </a>
              </div>
            ) : order.delivery_address.includes('Link GMaps: http') ? (
              <a 
                href={order.delivery_address.split('Link GMaps: ')[1]} 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center justify-center gap-2 px-4 py-3.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-base font-bold transition-colors w-full border border-blue-100"
              >
                <MapPin size={20} /> Abrir en Google Maps
              </a>
            ) : null}
          </div>

          {/* Lista de Productos */}
          <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2 h-fit">
             <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">Productos en el pedido</p>
             <ul className="text-sm space-y-3">
                {order.items.map(item => (
                  <li key={item.id} className="flex justify-between items-center text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                    <span className="font-medium pr-2 flex items-center">
                      <span className="text-primary font-black mr-3 bg-primary/10 px-2 py-1 rounded-md text-xs">{item.quantity}x</span> 
                      <div>
                        <span className="text-sm md:text-base leading-tight block">{item.product.name}</span>
                        {item.quantity > 1 && (
                          <span className="text-[11px] text-muted-foreground font-bold">{formatPrice(item.unit_price, (storeData as any)?.currency)} c/u</span>
                        )}
                      </div>
                    </span>
                    <span className="font-black text-gray-900 text-sm md:text-base">{formatPrice(item.quantity * item.unit_price, (storeData as any)?.currency)}</span>
                  </li>
                ))}
             </ul>
          </div>
        </div>
      </div>
      
      {/* Botones Flotantes en Mobile (Fijos abajo) */}
      <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-xl border-t border-gray-200 p-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-50">
        <div className="max-w-5xl mx-auto">
           {order.status === 'PENDING' && (
              <div className="flex gap-2">
                <Button onClick={() => changeStatus('CANCELLED')} variant="outline" className="w-1/3 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-black h-14 md:h-16 rounded-xl text-lg transition-transform active:scale-95">
                  <XCircle className="mr-2" size={24} /> Rechazar
                </Button>
                <Button onClick={() => changeStatus('ACCEPTED')} className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-black shadow-xl shadow-blue-500/20 h-14 md:h-16 rounded-xl text-lg md:text-xl transition-transform active:scale-95">
                  <CheckCircle className="mr-3" size={24} /> Aceptar
                </Button>
              </div>
            )}
            {order.status === 'ACCEPTED' && (
              <Button onClick={() => changeStatus('DISPATCHED')} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black shadow-xl shadow-purple-500/20 h-14 md:h-16 rounded-xl text-lg md:text-xl transition-transform active:scale-95">
                <Truck className="mr-3" size={24} /> Despachar Motorizado
              </Button>
            )}
            {order.status === 'DISPATCHED' && (
              <Button onClick={() => changeStatus('DELIVERED')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-xl shadow-emerald-500/20 h-14 md:h-16 rounded-xl text-lg md:text-xl transition-transform active:scale-95">
                <Check className="mr-3" size={24} /> Marcar como Entregado
              </Button>
            )}
            {order.status === 'DELIVERED' && (
              <div className="w-full text-center text-emerald-700 font-black py-4 text-base md:text-lg bg-emerald-100 rounded-xl border border-emerald-200">
                ✅ Pedido Completado Exitosamente
              </div>
            )}
            {order.status === 'CANCELLED' && (
              <div className="w-full text-center text-red-700 py-4 px-4 bg-red-100 rounded-xl border border-red-200">
                <span className="font-black text-base md:text-lg block">❌ Pedido Rechazado / Cancelado</span>
                {order.cancel_reason && <span className="text-sm md:text-base font-medium mt-1 block opacity-90">Razón: {order.cancel_reason}</span>}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
