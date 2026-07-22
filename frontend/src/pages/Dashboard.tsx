import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import api from '../api';
import { Bell, MapPin, CheckCircle, Package, Clock, Phone, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import AdminLayout from '../components/AdminLayout';
import { toast } from 'sonner';

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
  distance_km?: number | null;
  estimated_minutes?: number | null;
  createdAt: string;
  items: OrderItem[];
  user: {
    name: string | null;
    phone: string;
  };
}


export default function Dashboard() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [storeId, setStoreId] = useState<number | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [newOrderAlert, setNewOrderAlert] = useState<Order | null>(null);

  const [activeTab, setActiveTab] = useState("PENDING");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const columns = [
    { title: 'Nuevas Órdenes', status: 'PENDING', headerClass: 'bg-orange-50/50 text-orange-950 border-orange-100', badgeClass: 'bg-orange-100 text-orange-700' },
    { title: 'Preparando', status: 'ACCEPTED', headerClass: 'bg-blue-50/50 text-blue-950 border-blue-100', badgeClass: 'bg-blue-100 text-blue-700' },
    { title: 'En Camino', status: 'DISPATCHED', headerClass: 'bg-purple-50/50 text-purple-950 border-purple-100', badgeClass: 'bg-purple-100 text-purple-700' }
  ];

  useEffect(() => {
    const fetchStoreAndOrders = async () => {
      try {
        const storeRes = await api.get(`/stores/${slug}/products`);
        setStoreId(storeRes.data.store.id);

        const ordersRes = await api.get(`/stores/${slug}/orders`);
        setOrders(ordersRes.data);
      } catch (error) {
        console.error("Error cargando dashboard", error);
      }
    };
    fetchStoreAndOrders();

    // Solicitar permiso para notificaciones en segundo plano
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [slug]);

  useEffect(() => {
    if (!storeId) return;

    const socketURL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
    const socket: Socket = io(socketURL);

    socket.on('connect', () => {
      socket.emit('join_store', storeId);
    });

    socket.on('nuevo_pedido', (order: Order) => {
      setOrders(prev => [order, ...prev]);
      setNewOrderAlert(order);
      
      // Reproducir sonido
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.error("Autoplay bloqueado", e));
      }

      // Enviar Notificación nativa si estamos en otra pestaña
      if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
        const notif = new Notification("¡Nuevo Pedido en TiendaFast!", {
          body: `Pedido por $${order.total_amount.toFixed(2)} a entregar en: ${order.delivery_address.split(' |')[0]}`,
          icon: '/favicon.ico'
        });
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      }
    });

    socket.on('pedido_actualizado', (updatedOrder: Order) => {
      setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    });

    return () => {
      socket.disconnect();
    };
  }, [storeId]);

  const changeStatus = async (orderId: number, status: string) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
    } catch (error) {
      console.error("Error actualizando pedido", error);
      toast.error("Error actualizando el estado del pedido.");
    }
  };

  const handleInitialAccept = async () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (newOrderAlert) {
      await changeStatus(newOrderAlert.id, 'ACCEPTED');
    }
    setNewOrderAlert(null);
  };

  const handleRejectOrder = async () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (newOrderAlert) {
      const reason = window.prompt("¿Por qué deseas rechazar/cancelar este pedido?");
      if (reason === null) return;
      try {
        await api.put(`/orders/${newOrderAlert.id}/status`, { status: 'CANCELLED', cancel_reason: reason || undefined });
      } catch (e) {
        toast.error("Error al rechazar el pedido");
      }
    }
    setNewOrderAlert(null);
  };

  if (!storeId) return <div className="min-h-screen bg-background flex items-center justify-center font-bold text-muted-foreground">Cargando panel de control...</div>;

  return (
    <AdminLayout title="Panel de Despachos">

      {/* Alerta de Nuevo Pedido Rediseñada */}
      {newOrderAlert && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md border-0 shadow-2xl animate-in zoom-in-95 duration-300 bg-card overflow-hidden">
            <div className="h-2 w-full bg-primary animate-pulse"></div>
            <CardHeader className="text-center pt-8">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <Bell className="text-primary" size={40} />
              </div>
              <CardTitle className="text-3xl font-black tracking-tight text-foreground font-display">¡NUEVO PEDIDO!</CardTitle>
            </CardHeader>
            <CardContent className="pb-8">
              <div className="bg-muted/30 p-4 rounded-xl text-left mb-6 space-y-3">
                 <p className="text-sm font-bold flex items-center gap-2"><MapPin size={16} className="text-primary"/> {newOrderAlert.delivery_address.split(' |')[0]}</p>
                 <div className="border-t border-border pt-3">
                   <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Artículos ({newOrderAlert.items.length})</p>
                   <ul className="space-y-1">
                     {newOrderAlert.items.map(i => (
                       <li key={i.id} className="text-sm font-medium flex justify-between items-start">
                         <div>
                           <span>{i.quantity}x {i.product.name}</span>
                           {i.quantity > 1 && (
                             <span className="block text-[11px] text-muted-foreground font-bold">${i.unit_price.toFixed(2)} c/u</span>
                           )}
                         </div>
                         <span className="font-black">${(i.quantity * i.unit_price).toFixed(2)}</span>
                       </li>
                     ))}
                   </ul>
                 </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1 uppercase tracking-widest font-bold text-center">Monto a cobrar</p>
              <span className="font-black text-primary text-5xl block mb-8 font-display tracking-tight text-center">${newOrderAlert.total_amount.toFixed(2)}</span>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleRejectOrder}
                  variant="outline"
                  className="w-1/3 h-14 text-lg font-black text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 transition-all rounded-xl"
                >
                  <XCircle className="mr-2" size={20} /> Rechazar
                </Button>
                <Button
                  onClick={handleInitialAccept}
                  className="w-2/3 h-14 text-lg font-black bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30 transition-all rounded-xl"
                >
                  <CheckCircle className="mr-2" size={20} /> Aprobar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs y Tablas (Reemplazando Kanban) */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setCurrentPage(1); }} className="w-full mt-4">
        <TabsList className="grid w-full grid-cols-3 h-16 md:h-14 bg-muted/40 rounded-xl p-1.5 gap-1 shadow-inner overflow-x-auto">
          {columns.map(col => {
            const count = orders.filter(o => o.status === col.status).length;
            return (
              <TabsTrigger
                key={col.status}
                value={col.status}
                className="h-full rounded-lg font-bold text-[10px] md:text-sm uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all whitespace-normal md:whitespace-nowrap flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-1 md:px-3 leading-tight"
              >
                {col.title}
                {count > 0 && (
                  <Badge variant="secondary" className="font-black bg-primary/10 text-primary border-0 rounded-md px-1.5 py-0">
                    {count}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {columns.map(col => {
          const tabOrders = orders.filter(o => o.status === col.status);
          const totalPages = Math.ceil(tabOrders.length / ITEMS_PER_PAGE);
          const paginatedOrders = tabOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

          return (
          <TabsContent key={col.status} value={col.status} className="mt-6 animate-in fade-in-50 duration-300">
            {/* VISTA ESCRITORIO */}
            <Card className="hidden md:block border-border shadow-sm bg-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-black uppercase tracking-wider text-[11px]">ID / Hora</TableHead>
                      <TableHead className="font-black uppercase tracking-wider text-[11px]">Cliente</TableHead>
                      <TableHead className="font-black uppercase tracking-wider text-[11px] min-w-[200px]">Dirección</TableHead>
                      <TableHead className="font-black uppercase tracking-wider text-[11px]">Total</TableHead>
                      <TableHead className="font-black uppercase tracking-wider text-[11px]">Tiempo Est.</TableHead>
                      <TableHead className="text-right font-black uppercase tracking-wider text-[11px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-40 text-center">
                          <div className="flex flex-col items-center justify-center text-muted-foreground/60 space-y-3">
                            <Package size={40} className="opacity-40" />
                            <p className="font-bold text-sm tracking-wide">No hay pedidos en esta sección</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedOrders.map(order => (
                        <TableRow key={order.id} className="hover:bg-muted/40 transition-colors group">
                          <TableCell className="align-top py-4">
                            <span className="text-foreground font-black text-sm">#{order.id}</span>
                            <br />
                            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1 mt-1.5">
                              <Clock size={12} />
                              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </TableCell>

                          <TableCell className="align-top py-4">
                            <span className="font-black text-foreground">{order.user.name || 'Sin Nombre'}</span>
                            <br />
                            <span className="text-xs font-bold text-muted-foreground mt-1 block">{order.user.phone}</span>
                          </TableCell>

                          <TableCell className="align-top py-4">
                            <span className="text-sm font-medium text-foreground/80 line-clamp-2 leading-relaxed max-w-[280px]">
                              {order.delivery_address.split(' | Link GMaps:')[0]}
                            </span>
                          </TableCell>

                          <TableCell className="align-top py-4">
                            <span className="font-black text-lg text-foreground tracking-tight">${order.total_amount.toFixed(2)}</span>
                            <br />
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded shadow-sm inline-block mt-1.5 ${order.payment_method === 'CASH' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                              {order.payment_method === 'CASH' ? 'EFECTIVO' : 'PAGO MÓVIL'}
                            </span>
                          </TableCell>

                          <TableCell className="align-top py-4">
                            {order.estimated_minutes ? (
                              <Badge variant="outline" className="font-black text-orange-600 border-orange-200 bg-orange-50 shadow-sm py-1 px-2.5">
                                ~{order.estimated_minutes} min
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground/50 font-black text-sm">-</span>
                            )}
                          </TableCell>

                          <TableCell className="text-right align-top py-4">
                            <Button variant="secondary" size="sm" className="font-bold shadow-sm rounded-lg hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => navigate(`/admin/${slug}/order/${order.id}`)}>
                              Ver Detalles
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* VISTA MÓVIL */}
            <div className="md:hidden space-y-4 pb-6">
              {paginatedOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-muted-foreground/60 space-y-3 py-10 bg-card rounded-2xl border shadow-sm">
                  <Package size={40} className="opacity-40" />
                  <p className="font-bold text-sm tracking-wide">No hay pedidos</p>
                </div>
              ) : (
                paginatedOrders.map(order => (
                  <Card key={order.id} className="bg-card border-border shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-black text-primary">#{order.id}</p>
                          <p className="font-black text-lg leading-tight mt-0.5">{order.user.name || 'Sin Nombre'}</p>
                          <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1 mt-0.5"><Phone size={12} /> {order.user.phone}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md inline-flex items-center gap-1">
                            <Clock size={12} /> {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      <div className="bg-muted/50 p-2.5 rounded-lg border border-border/50">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1 mb-1">
                          <MapPin size={12} /> Dirección
                        </p>
                        <p className="font-medium text-sm text-foreground/90 leading-snug line-clamp-2">
                          {order.delivery_address.split(' | Link GMaps:')[0]}
                        </p>
                      </div>

                      <div className="flex justify-between items-end pt-1">
                        <div>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded shadow-sm inline-block ${order.payment_method === 'CASH' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                            {order.payment_method === 'CASH' ? 'EFECTIVO' : 'PAGO MÓVIL'}
                          </span>
                          {order.estimated_minutes && (
                            <Badge variant="outline" className="font-black text-orange-600 border-orange-200 bg-orange-50 shadow-sm py-0.5 px-2 ml-2 text-[10px]">
                              ~{order.estimated_minutes} min
                            </Badge>
                          )}
                        </div>
                        <span className="font-black text-xl text-foreground tracking-tight">${order.total_amount.toFixed(2)}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="p-3 bg-muted/30 border-t border-border flex justify-end">
                      <Button variant="secondary" size="sm" className="font-bold shadow-sm rounded-lg hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => navigate(`/admin/${slug}/order/${order.id}`)}>
                        Ver Detalles
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-6">
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
          </TabsContent>
        )})}
      </Tabs>

      {/* Audio para notificaciones */}
      <audio ref={audioRef} src="/notification.mp3" preload="auto" />
    </AdminLayout>
  );
}
