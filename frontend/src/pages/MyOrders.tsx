import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ArrowLeft, Clock, MapPin, Package, X, Store, CreditCard, Star, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';

import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { formatPrice } from '../utils/currency';

export default function MyOrders() {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');


  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);
  const paginatedOrders = orders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setRating(5);
    setReview('');
  }, [selectedOrder]);

  const handleRateOrder = async () => {
    try {
      await api.put(`/orders/${selectedOrder.id}/rate`, { rating, review }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, client_rating: rating, client_review: review } : o));
    } catch (error) {
      toast.error("Error al enviar calificación");
    }
  };

  const handleCancelOrder = async () => {
    const reason = window.prompt("¿Por qué deseas cancelar este pedido?");
    if (!reason || !reason.trim()) {
      toast.error("Debes proporcionar una razón para cancelar el pedido.");
      return;
    }
    try {
      await api.put(`/orders/${selectedOrder.id}/cancel`, { cancel_reason: reason }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // The socket will update it, but we can do optimistic update just in case
      const updatedOrder = { ...selectedOrder, status: 'CANCELLED', cancel_reason: reason };
      setSelectedOrder(updatedOrder);
      setOrders(prev => prev.map((o: any) => o.id === updatedOrder.id ? updatedOrder : o));
    } catch (error) {
      toast.error("No se pudo cancelar el pedido. Es posible que ya esté siendo preparado.");
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders/my-orders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(res.data);
      } catch (error) {
        console.error("Error al cargar pedidos:", error);
      }
      setLoading(false);
    };
    fetchOrders();
  }, [token, navigate]);

  // Sockets para actualización en tiempo real en todo el historial
  useEffect(() => {
    if (user?.id) {
      const socketURL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
      const socket = io(socketURL);
      socket.on('connect', () => socket.emit('join_client', user.id));
      socket.on('estado_actualizado', (updatedOrder) => {
        setOrders(prev => prev.map((o: any) => o.id === updatedOrder.id ? updatedOrder : o));
        setSelectedOrder((prev: any) => prev?.id === updatedOrder.id ? updatedOrder : prev);
      });
      return () => { socket.disconnect(); };
    }
  }, [user?.id]);

  const timelineSteps = [
    { status: 'PENDING', title: 'Pedido Recibido', desc: 'Confirmando tu orden.', icon: '📦' },
    { status: 'ACCEPTED', title: 'Preparando', desc: 'Empacando productos.', icon: '🛍️' },
    { status: 'DISPATCHED', title: 'En Camino', desc: 'El motorizado va hacia ti.', icon: '🛵' },
    { status: 'DELIVERED', title: 'Entregado', desc: '¡Gracias por comprar!', icon: '✨' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-20 sm:pt-24 pb-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto relative">
        <button onClick={() => navigate(-1)} className="absolute -top-12 sm:top-2 left-0 text-orange-500 hover:bg-gray-100 p-2 rounded-full transition-colors z-10">
          <ArrowLeft size={24} />
        </button>
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2 tracking-tight">Mis Pedidos</h1>
          <p className="text-gray-500">Hola, {user?.name || 'Cliente'}. Consulta el estado de tus compras en tiempo real.</p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500 font-bold">Cargando tus pedidos...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-700">Aún no tienes pedidos</h3>
            <p className="text-gray-500 mt-2">Cuando compres algo, aparecerá aquí.</p>
            <Button variant="outline" className="mt-6" onClick={() => navigate(-1)}>Volver a la tienda</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {paginatedOrders.map(order => (
              <Card 
                key={order.id} 
                onClick={() => setSelectedOrder(order)}
                className="overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-gray-100 cursor-pointer cursor-pointer group"
              >
                <div className={`p-4 text-white flex justify-between items-center transition-colors ${
                  order.status === 'PENDING' ? 'bg-orange-500' :
                  order.status === 'ACCEPTED' ? 'bg-blue-600' :
                  order.status === 'DISPATCHED' ? 'bg-purple-600' :
                  order.status === 'CANCELLED' ? 'bg-red-500' :
                  'bg-emerald-600'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                      <Package size={24} />
                    </div>
                    <div>
                      <span className="font-black text-xl block leading-none">Orden #{order.id}</span>
                      <span className="text-sm font-medium opacity-90 mt-1 block flex items-center gap-1">
                        <Clock size={12} /> {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="font-bold bg-white text-gray-900 border-none px-4 py-2 shadow-sm uppercase tracking-wider text-xs">
                    {order.status === 'PENDING' ? 'Recibida' : 
                     order.status === 'ACCEPTED' ? 'Preparando' : 
                     order.status === 'DISPATCHED' ? 'En Camino' : 
                     order.status === 'CANCELLED' ? 'Cancelada' : 
                     'Entregada'}
                  </Badge>
                </div>
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{order.delivery_address.split(' |')[0]}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-center min-w-[120px]">
                      <span className="text-gray-400 font-medium text-sm">Total pagado</span>
                      <span className="text-2xl font-black text-gray-900">{formatPrice(order.total_amount, order.store?.currency)}</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-sm">
                    <span className="text-gray-500">{order.items.length} artículos en esta orden</span>
                    <span className="text-orange-500 font-bold group-hover:underline flex items-center gap-1">
                      Ver detalles &rarr;
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl border-gray-200"
                >
                  <ChevronLeft size={20} />
                </Button>
                <span className="font-bold text-gray-600 text-sm">
                  Página {currentPage} de {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-xl border-gray-200"
                >
                  <ChevronRight size={20} />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Detalles del Pedido */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
            
            {/* Header del Modal */}
            <div className={`p-6 text-white text-center relative ${
                  selectedOrder.status === 'PENDING' ? 'bg-orange-500' :
                  selectedOrder.status === 'ACCEPTED' ? 'bg-blue-600' :
                  selectedOrder.status === 'DISPATCHED' ? 'bg-purple-600' :
                  selectedOrder.status === 'CANCELLED' ? 'bg-red-500' :
                  'bg-emerald-600'
            }`}>
              <button onClick={() => setSelectedOrder(null)} className="absolute top-4 right-4 bg-white/20 p-2 rounded-full hover:bg-white/40 transition">
                <X size={20} />
              </button>
              <h2 className="text-3xl font-black mb-1">Orden #{selectedOrder.id}</h2>
              <p className="opacity-90 font-medium">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
              {selectedOrder.estimated_minutes && selectedOrder.status !== 'DELIVERED' && selectedOrder.status !== 'CANCELLED' && (
                <div className="mt-3 inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                  <span>⏳</span> Tiempo estimado: ~{selectedOrder.estimated_minutes} min
                </div>
              )}
            </div>

            <div className="overflow-y-auto p-6 space-y-8 flex-1 bg-gray-50/50">
              {/* Timeline Dinámico */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="font-black text-gray-900 mb-6 text-lg flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> 
                  Estado en Tiempo Real
                </h3>
                <div className="relative border-l-4 border-gray-100 ml-4 space-y-8">
                  {(() => {
                    if (selectedOrder.status === 'CANCELLED') {
                      return (
                        <div className="text-center py-6 text-red-500 font-bold flex flex-col items-center">
                           <XCircle size={48} className="mb-2" />
                           <p>Este pedido ha sido cancelado.</p>
                           {selectedOrder.cancel_reason && <p className="text-sm mt-2 opacity-80 font-medium">Razón: {selectedOrder.cancel_reason}</p>}
                        </div>
                      );
                    }

                    let currentIndex = 0;
                    if (selectedOrder.status === 'ACCEPTED') currentIndex = 1;
                    if (selectedOrder.status === 'DISPATCHED') currentIndex = 2;
                    if (selectedOrder.status === 'DELIVERED') currentIndex = 3;

                    return timelineSteps.map((item, index) => {
                      const isCompleted = index <= currentIndex;
                      const isActive = index === currentIndex;
                      
                      return (
                        <div key={item.status} className={`relative pl-8 transition-all duration-700 ${isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                          <div className={`absolute -left-[22px] top-0 w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all duration-500 ${
                            isActive ? 'bg-orange-500 text-white animate-bounce' : 
                            isCompleted ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400 grayscale'
                          }`}>
                            {item.icon}
                          </div>
                          <div>
                            <h4 className={`font-black text-lg ${isActive ? 'text-orange-600' : 'text-gray-900'}`}>{item.title}</h4>
                            <p className="text-gray-500 text-sm mt-0.5">{item.desc}</p>
                            {item.status === 'DISPATCHED' && selectedOrder.estimated_minutes && (
                              <p className="text-xs font-bold bg-orange-100 text-orange-800 inline-block px-2 py-1 mt-2 rounded-md">
                                Tiempo de viaje: ~{selectedOrder.estimated_minutes} min
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Botón de Cancelar para Pedidos Pendientes */}
              {selectedOrder.status === 'PENDING' && (
                <div className="bg-red-50 p-4 rounded-3xl border border-red-100 text-center animate-in fade-in">
                  <p className="text-sm text-red-600 font-medium mb-3">Si te equivocaste en algo o ya no deseas el pedido, puedes cancelarlo antes de que sea aceptado por la tienda.</p>
                  <Button onClick={handleCancelOrder} variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-100 hover:text-red-700 font-black h-12 rounded-xl transition-transform active:scale-95">
                    <XCircle className="mr-2" size={20} /> Cancelar mi pedido
                  </Button>
                </div>
              )}

              {/* Interfaz de Calificación */}
              {(selectedOrder.status === 'DISPATCHED' || (selectedOrder.status === 'DELIVERED' && !selectedOrder.client_rating)) && (
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-3xl border border-orange-200 shadow-inner animate-in fade-in slide-in-from-bottom-4">
                  <h3 className="font-black text-orange-900 mb-4 text-center text-lg leading-tight">
                    {selectedOrder.status === 'DISPATCHED' ? '¿Ya recibiste tu pedido? ¡Confirma y califica!' : '¡Califica tu experiencia!'}
                  </h3>
                  <div className="flex justify-center gap-2 mb-5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        size={36} 
                        onClick={() => setRating(star)}
                        className={`cursor-pointer transition-all transform hover:scale-110 ${star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <textarea 
                    placeholder="Déjanos un comentario sobre el servicio (opcional)" 
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    className="w-full p-4 rounded-2xl border-2 border-orange-100 focus:ring-orange-500 focus:border-orange-500 mb-4 text-sm resize-none"
                    rows={2}
                  />
                  <Button onClick={handleRateOrder} className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 font-black text-white shadow-lg shadow-orange-500/30 rounded-2xl h-14 text-base transform hover:scale-[1.02] transition-all">
                    {selectedOrder.status === 'DISPATCHED' ? 'Confirmar Recepción y Calificar' : 'Enviar Calificación'}
                  </Button>
                </div>
              )}

              {/* Feedback Ya Enviado */}
              {selectedOrder.status === 'DELIVERED' && selectedOrder.client_rating && (
                <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 text-center animate-in fade-in">
                   <h3 className="font-black text-emerald-900 mb-3 text-lg">¡Gracias por tu calificación!</h3>
                   <div className="flex justify-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        size={24} 
                        className={star <= selectedOrder.client_rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                  {selectedOrder.client_review && <p className="text-sm text-emerald-700 italic font-medium">"{selectedOrder.client_review}"</p>}
                </div>
              )}

              {/* Lista de Artículos */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="font-black text-gray-900 mb-4 text-lg">Resumen de Artículos</h3>
                <div className="space-y-4">
                  {selectedOrder.items.map((item: any) => (
                    <div key={item.id} className="flex gap-4 items-center border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                      <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500">
                        <Store size={20} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800 text-sm">{item.product.name}</h4>
                        <span className="text-gray-500 text-xs">{item.quantity} x {formatPrice(item.unit_price, selectedOrder.store?.currency)}</span>
                      </div>
                      <div className="font-black text-gray-900">
                        {formatPrice(item.quantity * item.unit_price, selectedOrder.store?.currency)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Información Adicional */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <div>
                  <h4 className="font-black text-gray-800 text-sm mb-1 flex items-center gap-2"><MapPin size={16} className="text-gray-400"/> Dirección de Entrega</h4>
                  <p className="text-gray-600 text-sm pl-6">{selectedOrder.delivery_address}</p>
                </div>
                <div className="pt-2">
                  <h4 className="font-black text-gray-800 text-sm mb-1 flex items-center gap-2"><CreditCard size={16} className="text-gray-400"/> Pago</h4>
                  <p className="text-gray-600 text-sm pl-6">
                    {selectedOrder.payment_method === 'CASH' ? 'Efectivo al llegar' : `Pago Móvil (Ref: ${selectedOrder.payment_reference})`}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white border-t border-gray-100 flex justify-between items-center shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
              <span className="text-gray-500 font-bold uppercase tracking-wider text-sm">Total Pagado</span>
              <span className="text-3xl font-black text-gray-900">{formatPrice(selectedOrder.total_amount, selectedOrder.store?.currency)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
