import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { getSocketURL } from '../lib/socket';
import api from '../api';
import { Bell, MapPin, CheckCircle, Package, Clock, Phone, XCircle, ChevronLeft, ChevronRight, CheckSquare, Trash2, Truck, User, X, Utensils, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Checkbox } from '../components/ui/checkbox';
import AdminLayout from '../components/AdminLayout';
import RejectOrderDialog from '../components/RejectOrderDialog';
import ConnectionStatus from '../components/ConnectionStatus';
import { toast } from 'sonner';
import { formatPrice } from '../utils/currency';

interface OrderItem {
  id: number;
  quantity: number;
  unit_price: number;
  product: { name: string };
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
  viewed?: boolean;
  distance_km?: number | null;
  estimated_minutes?: number | null;
  createdAt: string;
  items: OrderItem[];
  user: { name: string | null; phone: string };
  driver?: { id: number; name: string; phone: string; vehicle_plate: string | null } | null;
}

interface Driver {
  id: number;
  name: string;
  phone: string;
  vehicle_plate: string | null;
  is_active: boolean;
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function getElapsedMinutes(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
}

function getItemsSummary(items: OrderItem[]): string {
  if (items.length === 0) return 'Sin productos';
  const maxShow = 2;
  const shown = items.slice(0, maxShow);
  const summary = shown.map(i => `${i.quantity}x ${i.product.name}`).join(', ');
  if (items.length > maxShow) return `${summary} +${items.length - maxShow} más`;
  return summary;
}

function getPaymentLabel(method: string): string {
  if (method === 'CASH') return 'EFECTIVO';
  if (method === 'TRANSFER') return 'PAGO MÓVIL';
  return method;
}

function getPaymentColor(method: string): string {
  if (method === 'CASH') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  return 'bg-blue-100 text-blue-700 border-blue-200';
}

export default function Dashboard() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [storeId, setStoreId] = useState<number | null>(null);
  const [storeConfig, setStoreConfig] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [alertQueue, setAlertQueue] = useState<Order[]>([]);
  const [rejectTarget, setRejectTarget] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState("PENDING");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [connected, setConnected] = useState(true);
  const [, setTick] = useState(0);
  const [showDispatchModal, setShowDispatchModal] = useState<Order | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<number | ''>('');
  const ITEMS_PER_PAGE = 10;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urgentAudioRef = useRef<HTMLAudioElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  // IDs de pedidos pendientes ya alertados (evita duplicar alertas en re-fetch)
  const alertedPendingIds = useRef<Set<number>>(new Set());

  // 3 columnas simplificadas: Nuevas (AWAITING_PAYMENT + PENDING), Preparando (ACCEPTED), En Camino (DISPATCHED)
  const columns = [
    { title: 'Nuevas', status: 'PENDING', icon: Bell, headerClass: 'bg-orange-50/50 text-orange-950 border-orange-100', badgeClass: 'bg-orange-100 text-orange-700', color: 'orange' },
    { title: 'Preparando', status: 'ACCEPTED', icon: Utensils, headerClass: 'bg-blue-50/50 text-blue-950 border-blue-100', badgeClass: 'bg-blue-100 text-blue-700', color: 'blue' },
    { title: 'En Camino', status: 'DISPATCHED', icon: Truck, headerClass: 'bg-purple-50/50 text-purple-950 border-purple-100', badgeClass: 'bg-purple-100 text-purple-700', color: 'purple' }
  ];

  // Unificar AWAITING_PAYMENT y PENDING como "Nuevas"
  const isNuevas = (status: string) => status === 'PENDING' || status === 'AWAITING_PAYMENT';

  const pendingUnread = orders.filter(o => isNuevas(o.status) && !o.viewed).length;

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  // Alerta las órdenes pendientes no vistas que el fetch trae (p. ej. las que
  // llegaron mientras el admin estaba offline o con el socket desconectado),
  // igual que si hubieran llegado en vivo, sin duplicar las ya alertadas.
  const enqueuePendingAlerts = useCallback((orders: Order[]) => {
    const newPending = orders.filter(
      o => isNuevas(o.status) && !o.viewed && !alertedPendingIds.current.has(o.id)
    );
    if (newPending.length === 0) return;

    setAlertQueue(prev => {
      const existing = new Set(prev.map(o => o.id));
      const toAdd = newPending.filter(o => !existing.has(o.id));
      return [...prev, ...toAdd];
    });
    newPending.forEach(o => alertedPendingIds.current.add(o.id));

    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }

    if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
      newPending.slice(0, 5).forEach((order: Order) => {
        const notif = new Notification("¡Nuevo Pedido!", {
          body: `${formatPrice(order.total_amount, storeConfig?.currency)} - ${order.delivery_address.split(' |')[0]}`,
          icon: '/favicon.ico'
        });
        notif.onclick = () => { window.focus(); notif.close(); };
      });
    }
  }, [storeConfig]);

  const fetchOrders = useCallback(async () => {
    if (!slug) return;
    try {
      const res = await api.get(`/stores/${slug}/orders`);
      setOrders(res.data.orders);
      if (res.data.storeId) {
        setStoreId(res.data.storeId);
      }
      enqueuePendingAlerts(res.data.orders);
    } catch (error) {
      console.error("Error cargando dashboard", error);
    }
  }, [slug, enqueuePendingAlerts]);

  const fetchStoreConfig = useCallback(async () => {
    if (!slug) return;
    try {
      const res = await api.get(`/stores/${slug}/products?limit=1`);
      if (res.data.store) {
        setStoreConfig(res.data.store);
      }
    } catch (error) {
      console.error("Error cargando config de tienda", error);
    }
  }, [slug]);

  const fetchDrivers = useCallback(async () => {
    if (!slug) return;
    try {
      const res = await api.get(`/stores/${slug}/drivers`);
      setDrivers(res.data.drivers.filter((d: Driver) => d.is_active));
    } catch (error) {
      console.error("Error cargando motorizados", error);
    }
  }, [slug]);

  useEffect(() => {
    fetchOrders();
    fetchStoreConfig();
    fetchDrivers();
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [fetchOrders, fetchStoreConfig, fetchDrivers]);

  useEffect(() => {
    if (!storeId) return;

    const socketURL = getSocketURL();
    let reconnectAttempts = 0;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connectSocket() {
      const socket: Socket = io(socketURL, { reconnection: false });
      socketRef.current = socket;

      socket.on('connect', () => {
        setConnected(true);
        reconnectAttempts = 0;
        socket.emit('join_store', storeId);
      });

      socket.on('disconnect', () => {
        setConnected(false);
        scheduleReconnect();
      });

      socket.on('connect_error', () => {
        setConnected(false);
        scheduleReconnect();
      });

      socket.on('nuevo_pedido', (order: Order) => {
        setOrders(prev => [order, ...prev]);
        setAlertQueue(prev => [...prev, order]);

        if (audioRef.current) {
          audioRef.current.play().catch(() => {});
        }

        if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
          const notif = new Notification("¡Nuevo Pedido!", {
            body: `${formatPrice(order.total_amount, storeConfig?.currency)} - ${order.delivery_address.split(' |')[0]}`,
            icon: '/favicon.ico'
          });
          notif.onclick = () => { window.focus(); notif.close(); };
        }
      });

      socket.on('pedido_actualizado', (updatedOrder: Order) => {
        setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
        setAlertQueue(prev => prev.filter(o => o.id !== updatedOrder.id));
        // Si el pedido actualizado es el que se está despachando, cerrar modal
        setShowDispatchModal(prev => prev?.id === updatedOrder.id ? null : prev);
      });
    }

    function scheduleReconnect() {
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
      reconnectAttempts++;
      reconnectTimer = setTimeout(connectSocket, delay);
    }

    connectSocket();

    return () => {
      clearTimeout(reconnectTimer);
      socketRef.current?.disconnect();
    };
  }, [storeId]);

  useEffect(() => {
    if (!slug) return;
    const interval = setInterval(() => {
      if (!socketRef.current?.connected) {
        fetchOrders();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [slug, fetchOrders]);

  const changeStatus = async (orderId: number, status: string, cancel_reason?: string, driver_id?: number) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status, cancel_reason, driver_id });
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err?.response?.status === 409) {
        toast.error("Este pedido ya fue modificado por otro admin. Recargando...");
        fetchOrders();
      } else {
        toast.error("Error actualizando el estado del pedido.");
      }
    }
  };

  const handleAcceptAlert = async (orderId: number) => {
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    urgentAudioRef.current?.pause();
    if (urgentAudioRef.current) urgentAudioRef.current.currentTime = 0;
    await changeStatus(orderId, 'ACCEPTED');
    setAlertQueue(prev => prev.filter(o => o.id !== orderId));
    toast.success("Pedido aceptado → Preparando");
  };

  const handleRejectFromAlert = async (reason: string) => {
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    urgentAudioRef.current?.pause();
    if (urgentAudioRef.current) urgentAudioRef.current.currentTime = 0;
    if (rejectTarget) {
      await changeStatus(rejectTarget.id, 'CANCELLED', reason || undefined);
      setAlertQueue(prev => prev.filter(o => o.id !== rejectTarget.id));
      setRejectTarget(null);
    }
  };

  const handleQuickApprove = async (orderId: number) => {
    await changeStatus(orderId, 'ACCEPTED');
    toast.success("Pedido aceptado → Preparando");
  };

  const handleQuickReject = (order: Order) => {
    setRejectTarget(order);
  };

  const handleDispatch = (order: Order) => {
    setShowDispatchModal(order);
    setSelectedDriverId('');
  };

  const handleConfirmDispatch = async () => {
    if (!showDispatchModal) return;
    await changeStatus(showDispatchModal.id, 'DISPATCHED', undefined, selectedDriverId ? Number(selectedDriverId) : undefined);
    setShowDispatchModal(null);
    toast.success("Pedido despachado → En Camino");
  };

  const handleMarkDelivered = async (orderId: number) => {
    await changeStatus(orderId, 'DELIVERED');
    toast.success("Pedido marcado como entregado");
  };

  const handleBatchAction = async (status: string) => {
    if (selectedIds.length === 0) return;
    try {
      const res = await api.put('/orders/batch-status', { order_ids: selectedIds, status });
      toast.success(`${res.data.updated} pedidos actualizados`);
      setSelectedIds([]);
      setSelectMode(false);
      fetchOrders();
    } catch {
      toast.error("Error al actualizar pedidos");
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = (ids: number[]) => {
    const allSelected = ids.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...ids])]);
    }
  };

  const markViewed = async (orderId: number) => {
    const order = orders.find(o => o.id === orderId);
    if (order && !order.viewed) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, viewed: true } : o));
      api.put(`/orders/${orderId}/viewed`).catch(() => {});
    }
  };

  const getOrdersForColumn = (status: string) => {
    if (status === 'PENDING') {
      // "Nuevas" incluye AWAITING_PAYMENT y PENDING
      return orders.filter(o => isNuevas(o.status));
    }
    return orders.filter(o => o.status === status);
  };

  // Atajos de teclado para la cola de alertas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (alertQueue.length > 0) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAcceptAlert(alertQueue[0].id);
        } else if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          setRejectTarget(alertQueue[0]);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setAlertQueue(prev => prev.slice(1));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [alertQueue]);

  if (!storeId) return <div className="min-h-screen bg-background flex items-center justify-center font-bold text-muted-foreground">Cargando panel de control...</div>;

  return (
    <AdminLayout title="Panel de Despachos">
      <ConnectionStatus connected={connected} />

      {/* Tarjeta Flotante de Alertas (reemplaza el modal bloqueante) */}
      {alertQueue.length > 0 && (
        <div className="fixed top-4 right-4 z-50 w-[calc(100vw-2rem)] sm:w-[380px] left-4 sm:left-auto max-h-[calc(100vh-2rem)] overflow-y-auto space-y-3">
          {alertQueue.slice(0, 3).map((order, idx) => {
            const elapsed = getElapsedMinutes(order.createdAt);
            const isUrgent = elapsed > 10;
            return (
              <Card
                key={order.id}
                className={`border-0 shadow-2xl animate-in slide-in-from-right duration-500 bg-card overflow-hidden ${isUrgent ? 'ring-2 ring-red-500' : 'ring-2 ring-orange-400'}`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className={`h-1.5 w-full ${isUrgent ? 'bg-red-500 animate-pulse' : 'bg-orange-400'}`} />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isUrgent ? 'bg-red-100' : 'bg-orange-100'}`}>
                        <Bell className={isUrgent ? 'text-red-600' : 'text-orange-600'} size={20} />
                      </div>
                      <div>
                        <p className="font-black text-sm">¡NUEVO PEDIDO!</p>
                        <p className="text-xs text-muted-foreground font-bold">#{order.id} • {timeAgo(order.createdAt)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setAlertQueue(prev => prev.filter(o => o.id !== order.id))}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="bg-muted/30 p-3 rounded-lg text-left mb-3 space-y-1.5">
                    <p className="text-xs font-bold flex items-center gap-1.5">
                      <MapPin size={12} className="text-primary" />
                      {order.delivery_address.split(' |')[0]}
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">
                      {order.items.length} artículo(s): {getItemsSummary(order.items)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${getPaymentColor(order.payment_method)}`}>
                      {getPaymentLabel(order.payment_method)}
                    </span>
                    <span className="font-black text-xl text-foreground">
                      {formatPrice(order.total_amount, storeConfig?.currency)}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => setRejectTarget(order)}
                      variant="outline"
                      className="flex-1 h-10 font-bold text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 transition-all rounded-lg text-xs"
                    >
                      <XCircle size={14} className="mr-1" /> Rechazar
                    </Button>
                    <Button
                      onClick={() => handleAcceptAlert(order.id)}
                      className="flex-[2] h-10 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 transition-all rounded-lg text-xs"
                    >
                      <CheckCircle size={14} className="mr-1" /> Aprobar
                    </Button>
                  </div>

                  {alertQueue.length > 1 && idx === 0 && (
                    <p className="text-[10px] text-muted-foreground text-center mt-2 font-bold">
                      +{alertQueue.length - 1} pedido(s) más esperando
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Barra de acciones masivas */}
      {selectMode && selectedIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-40 p-4 flex flex-col sm:flex-row items-center sm:justify-between gap-3">
          <span className="font-bold text-sm shrink-0">{selectedIds.length} seleccionados</span>
          <div className="flex gap-2 flex-wrap justify-center">
            <Button variant="outline" size="sm" onClick={() => { setSelectMode(false); setSelectedIds([]); }}>Cancelar</Button>
            <Button variant="destructive" size="sm" className="font-bold" onClick={() => handleBatchAction('CANCELLED')}>
              <Trash2 size={14} className="mr-1" /> Rechazar
            </Button>
            <Button size="sm" className="font-bold bg-emerald-600 hover:bg-emerald-700" onClick={() => handleBatchAction('ACCEPTED')}>
              <CheckCircle size={14} className="mr-1" /> Aceptar
            </Button>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setCurrentPage(1); }} className="w-full mt-4">
        <TabsList className="grid w-full grid-cols-3 h-16 md:h-14 bg-muted/40 rounded-xl p-1.5 gap-1 shadow-inner overflow-x-auto">
          {columns.map(col => {
            const count = getOrdersForColumn(col.status).length;
            const unreadCount = col.status === 'PENDING' ? pendingUnread : 0;
            return (
              <TabsTrigger
                key={col.status}
                value={col.status}
                className="h-full rounded-lg font-bold text-[10px] md:text-sm uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all whitespace-normal md:whitespace-nowrap flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-1 md:px-3 leading-tight"
              >
                <col.icon size={14} className="hidden md:block" />
                {col.title}
                {count > 0 && (
                  <Badge variant="secondary" className={`font-black border-0 rounded-md px-1.5 py-0 ${unreadCount > 0 ? 'bg-red-500 text-white animate-pulse' : 'bg-primary/10 text-primary'}`}>
                    {count}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {columns.map(col => {
          const tabOrders = getOrdersForColumn(col.status);
          const totalPages = Math.ceil(tabOrders.length / ITEMS_PER_PAGE);
          const paginatedOrders = tabOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
          const tabIds = paginatedOrders.map(o => o.id);

          return (
          <TabsContent key={col.status} value={col.status} className="mt-6 animate-in fade-in-50 duration-300">
            {/* VISTA ESCRITORIO */}
            <Card className="hidden md:block border-border shadow-sm bg-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                      {selectMode && col.status === 'PENDING' && (
                        <TableHead className="w-10">
                          <Checkbox checked={tabIds.length > 0 && tabIds.every(id => selectedIds.includes(id))} onCheckedChange={() => toggleSelectAll(tabIds)} />
                        </TableHead>
                      )}
                      <TableHead className="font-black uppercase tracking-wider text-[11px] w-[140px]">Pedido</TableHead>
                      <TableHead className="font-black uppercase tracking-wider text-[11px] w-[180px]">Cliente</TableHead>
                      <TableHead className="font-black uppercase tracking-wider text-[11px] min-w-[220px]">Dirección / Productos</TableHead>
                      <TableHead className="font-black uppercase tracking-wider text-[11px] w-[120px]">Pago</TableHead>
                      <TableHead className="font-black uppercase tracking-wider text-[11px] w-[100px]">Tiempo</TableHead>
                      <TableHead className="text-right font-black uppercase tracking-wider text-[11px] w-[200px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={selectMode ? 7 : 6} className="h-40 text-center">
                          <div className="flex flex-col items-center justify-center text-muted-foreground/60 space-y-3">
                            <Package size={40} className="opacity-40" />
                            <p className="font-bold text-sm tracking-wide">No hay pedidos en esta sección</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedOrders.map(order => {
                        const elapsed = getElapsedMinutes(order.createdAt);
                        const isUrgent = elapsed > 10 && isNuevas(order.status);
                        const isCritical = elapsed > 20 && isNuevas(order.status);
                        return (
                        <TableRow
                          key={order.id}
                          className={`hover:bg-muted/40 transition-colors group cursor-pointer ${
                            !order.viewed && isNuevas(order.status) ? 'bg-primary/5' : ''
                          } ${isCritical ? 'border-l-4 border-l-red-500 bg-red-50/30' : isUrgent ? 'border-l-4 border-l-orange-400 bg-orange-50/20' : ''}`}
                          onClick={() => { markViewed(order.id); }}
                        >
                          {selectMode && col.status === 'PENDING' && (
                            <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                              <Checkbox checked={selectedIds.includes(order.id)} onCheckedChange={() => toggleSelect(order.id)} />
                            </TableCell>
                          )}
                          <TableCell className="align-top py-3">
                            <div className="flex items-center gap-2">
                              {!order.viewed && isNuevas(order.status) && (
                                <div className="w-2 h-2 bg-primary rounded-full animate-pulse flex-shrink-0" />
                              )}
                              <span className="text-foreground font-black text-sm">#{order.id}</span>
                            </div>
                            {order.driver && (
                              <p className="text-[10px] font-bold text-purple-600 flex items-center gap-1 mt-1">
                                <Truck size={10} /> {order.driver.name}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="align-top py-3">
                            <span className="font-black text-foreground text-sm">{order.user.name || 'Sin Nombre'}</span>
                            <br />
                            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Phone size={10} /> {order.user.phone}
                            </span>
                          </TableCell>
                          <TableCell className="align-top py-3">
                            <p className="text-xs font-medium text-foreground/80 line-clamp-1 leading-relaxed">
                              {order.delivery_address.split(' | Link GMaps:')[0]}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-bold mt-1 line-clamp-1">
                              {getItemsSummary(order.items)}
                            </p>
                          </TableCell>
                          <TableCell className="align-top py-3">
                            <span className="font-black text-base text-foreground tracking-tight block">{formatPrice(order.total_amount, storeConfig?.currency)}</span>
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded inline-block mt-1 ${getPaymentColor(order.payment_method)}`}>
                              {getPaymentLabel(order.payment_method)}
                            </span>
                          </TableCell>
                          <TableCell className="align-top py-3">
                            <Badge
                              variant="outline"
                              className={`font-black border-0 py-1 px-2 text-xs ${
                                isCritical ? 'bg-red-100 text-red-700 animate-pulse' :
                                isUrgent ? 'bg-orange-100 text-orange-700' :
                                'bg-muted text-muted-foreground'
                              }`}
                            >
                              <Clock size={10} className="mr-1" />
                              {timeAgo(order.createdAt)}
                            </Badge>
                            {order.estimated_minutes && (
                              <p className="text-[10px] text-muted-foreground font-bold mt-1">
                                ETA: ~{order.estimated_minutes} min
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-right align-top py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              {isNuevas(order.status) && (
                                <>
                                  <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 font-bold rounded-lg h-8 px-2" onClick={(e) => { e.stopPropagation(); handleQuickReject(order); }}>
                                    <XCircle size={14} />
                                  </Button>
                                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 font-bold rounded-lg h-8 px-3 text-xs" onClick={(e) => { e.stopPropagation(); handleQuickApprove(order.id); }}>
                                    <CheckCircle size={14} className="mr-1" /> Aprobar
                                  </Button>
                                </>
                              )}
                              {order.status === 'ACCEPTED' && (
                                <Button size="sm" className="bg-purple-600 hover:bg-purple-700 font-bold rounded-lg h-8 px-3 text-xs shadow-sm shadow-purple-500/20" onClick={(e) => { e.stopPropagation(); handleDispatch(order); }}>
                                  <Truck size={14} className="mr-1" /> Despachar
                                </Button>
                              )}
                              {order.status === 'DISPATCHED' && (
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 font-bold rounded-lg h-8 px-3 text-xs" onClick={(e) => { e.stopPropagation(); handleMarkDelivered(order.id); }}>
                                  <Check size={14} className="mr-1" /> Entregado
                                </Button>
                              )}
                              <Button variant="secondary" size="sm" className="font-bold shadow-sm rounded-lg h-8 px-2 hover:bg-primary/10 hover:text-primary transition-colors text-xs" onClick={(e) => { e.stopPropagation(); navigate(`/admin/${slug}/order/${order.id}`); }}>
                                Ver
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* VISTA MÓVIL */}
            <div className="md:hidden space-y-3 pb-6">
              {col.status === 'PENDING' && paginatedOrders.length > 0 && (
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" className="font-bold" onClick={() => { setSelectMode(!selectMode); if (selectMode) setSelectedIds([]); }}>
                    {selectMode ? <XCircle size={14} className="mr-1" /> : <CheckSquare size={14} className="mr-1" />}
                    {selectMode ? 'Cancelar' : 'Seleccionar'}
                  </Button>
                </div>
              )}
              {paginatedOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-muted-foreground/60 space-y-3 py-10 bg-card rounded-2xl border shadow-sm">
                  <Package size={40} className="opacity-40" />
                  <p className="font-bold text-sm tracking-wide">No hay pedidos</p>
                </div>
              ) : (
                paginatedOrders.map(order => {
                  const elapsed = getElapsedMinutes(order.createdAt);
                  const isUrgent = elapsed > 10 && isNuevas(order.status);
                  const isCritical = elapsed > 20 && isNuevas(order.status);
                  return (
                  <Card key={order.id} className={`bg-card border-border shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${isCritical ? 'border-l-4 border-l-red-500' : isUrgent ? 'border-l-4 border-l-orange-400' : ''}`}>
                    <CardContent className="p-4 space-y-3">
                      {/* Header: ID + Tiempo + Urgencia */}
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-2">
                          {selectMode && col.status === 'PENDING' && (
                            <Checkbox checked={selectedIds.includes(order.id)} onCheckedChange={() => toggleSelect(order.id)} className="mt-1" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              {!order.viewed && isNuevas(order.status) && (
                                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                              )}
                              <p className="text-xs font-black text-primary">#{order.id}</p>
                            </div>
                            <p className="font-black text-lg leading-tight mt-0.5">{order.user.name || 'Sin Nombre'}</p>
                            <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1 mt-0.5"><Phone size={12} /> {order.user.phone}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant="outline"
                            className={`font-black border-0 py-1 px-2 text-xs ${
                              isCritical ? 'bg-red-100 text-red-700 animate-pulse' :
                              isUrgent ? 'bg-orange-100 text-orange-700' :
                              'bg-muted text-muted-foreground'
                            }`}
                          >
                            <Clock size={10} className="mr-1" /> {timeAgo(order.createdAt)}
                          </Badge>
                          {(isCritical || isUrgent) && (
                            <p className={`text-[10px] font-black mt-1 ${isCritical ? 'text-red-500' : 'text-orange-500'}`}>
                              {isCritical ? 'CRÍTICO' : 'URGENTE'}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Dirección */}
                      <div className="bg-muted/50 p-2.5 rounded-lg border border-border/50">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1 mb-1">
                          <MapPin size={12} /> Dirección
                        </p>
                        <p className="font-medium text-sm text-foreground/90 leading-snug line-clamp-2">
                          {order.delivery_address.split(' | Link GMaps:')[0]}
                        </p>
                      </div>

                      {/* Resumen de Productos */}
                      <div className="bg-muted/30 p-2.5 rounded-lg border border-border/50">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1 mb-1">
                          <Package size={12} /> Productos ({order.items.length})
                        </p>
                        <p className="text-xs font-medium text-foreground/80 line-clamp-2">
                          {getItemsSummary(order.items)}
                        </p>
                      </div>

                      {/* Pago + Total + ETA */}
                      <div className="flex justify-between items-end pt-1">
                        <div className="flex flex-col gap-1">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded shadow-sm inline-flex items-center w-fit ${getPaymentColor(order.payment_method)}`}>
                            {getPaymentLabel(order.payment_method)}
                          </span>
                          {order.estimated_minutes && (
                            <Badge variant="outline" className="font-black text-orange-600 border-orange-200 bg-orange-50 shadow-sm py-0.5 px-2 text-[10px] w-fit">
                              ETA: ~{order.estimated_minutes} min
                            </Badge>
                          )}
                          {order.driver && (
                            <Badge variant="outline" className="font-black text-purple-600 border-purple-200 bg-purple-50 shadow-sm py-0.5 px-2 text-[10px] w-fit">
                              <Truck size={10} className="mr-1" /> {order.driver.name}
                            </Badge>
                          )}
                        </div>
                        <span className="font-black text-xl text-foreground tracking-tight">{formatPrice(order.total_amount, storeConfig?.currency)}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="p-3 bg-muted/30 border-t border-border">
                      {isNuevas(order.status) ? (
                        <div className="flex gap-2 w-full">
                          <Button variant="outline" size="sm" className="flex-1 font-bold text-red-600 border-red-200 hover:bg-red-50 rounded-lg" onClick={() => handleQuickReject(order)}>
                            <XCircle size={14} className="mr-1" /> Rechazar
                          </Button>
                          <Button size="sm" className="flex-[2] font-bold bg-emerald-600 hover:bg-emerald-700 rounded-lg" onClick={() => handleQuickApprove(order.id)}>
                            <CheckCircle size={14} className="mr-1" /> Aprobar
                          </Button>
                        </div>
                      ) : order.status === 'ACCEPTED' ? (
                        <div className="flex gap-2 w-full">
                          <Button size="sm" className="flex-1 font-bold bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm shadow-purple-500/20" onClick={() => handleDispatch(order)}>
                            <Truck size={14} className="mr-1" /> Despachar
                          </Button>
                          <Button variant="secondary" size="sm" className="font-bold rounded-lg" onClick={() => navigate(`/admin/${slug}/order/${order.id}`)}>
                            Ver
                          </Button>
                        </div>
                      ) : order.status === 'DISPATCHED' ? (
                        <div className="flex gap-2 w-full">
                          <Button size="sm" className="flex-1 font-bold bg-emerald-600 hover:bg-emerald-700 rounded-lg" onClick={() => handleMarkDelivered(order.id)}>
                            <Check size={14} className="mr-1" /> Entregado
                          </Button>
                          <Button variant="secondary" size="sm" className="font-bold rounded-lg" onClick={() => navigate(`/admin/${slug}/order/${order.id}`)}>
                            Ver
                          </Button>
                        </div>
                      ) : (
                        <div className="w-full flex justify-end">
                          <Button variant="secondary" size="sm" className="font-bold shadow-sm rounded-lg hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => navigate(`/admin/${slug}/order/${order.id}`)}>
                            Ver Detalles
                          </Button>
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                  );
                })
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-6">
                <Button variant="outline" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-xl">
                  <ChevronLeft size={20} />
                </Button>
                <span className="font-bold text-gray-600 text-sm">Página {currentPage} de {totalPages}</span>
                <Button variant="outline" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded-xl">
                  <ChevronRight size={20} />
                </Button>
              </div>
            )}
          </TabsContent>
          );
        })}
      </Tabs>

      {/* Modal de Despacho Rápido */}
      {showDispatchModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm border-0 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="h-1.5 w-full bg-purple-500" />
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-black text-foreground">Despachar Pedido</h3>
                  <p className="text-xs text-muted-foreground font-bold">#{showDispatchModal.id} • {formatPrice(showDispatchModal.total_amount, storeConfig?.currency)}</p>
                </div>
                <button onClick={() => setShowDispatchModal(null)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                  <XCircle size={20} />
                </button>
              </div>

              <p className="text-sm text-muted-foreground mb-4 font-medium">Selecciona un motorizado para entregar este pedido.</p>

              {drivers.length > 0 ? (
                <div className="space-y-2 mb-4 max-h-[200px] overflow-y-auto">
                  {drivers.map(d => (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDriverId(d.id === selectedDriverId ? '' : d.id)}
                      className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                        selectedDriverId === d.id
                          ? 'border-purple-500 bg-purple-50 shadow-sm'
                          : 'border-border hover:border-purple-200 hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm text-foreground">{d.name}</p>
                          <p className="text-xs text-muted-foreground font-medium">{d.phone} {d.vehicle_plate ? `• ${d.vehicle_plate}` : ''}</p>
                        </div>
                        {selectedDriverId === d.id && (
                          <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                            <CheckCircle size={14} className="text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 mb-4 bg-muted/30 rounded-xl">
                  <User size={24} className="mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground font-bold">No hay motorizados disponibles</p>
                  <p className="text-xs text-muted-foreground">Puedes despachar sin asignar</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={() => setShowDispatchModal(null)} variant="outline" className="flex-1 font-bold rounded-lg">
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmDispatch}
                  className="flex-[2] bg-purple-600 hover:bg-purple-700 text-white font-black rounded-lg shadow-lg shadow-purple-500/20"
                >
                  <Truck size={16} className="mr-2" />
                  {selectedDriverId ? 'Asignar y Despachar' : 'Despachar sin Asignar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <RejectOrderDialog
        open={rejectTarget !== null}
        onOpenChange={(open) => { if (!open) setRejectTarget(null); }}
        onReject={handleRejectFromAlert}
        orderId={rejectTarget?.id || 0}
      />

      <audio ref={audioRef} src="/notification.mp3" preload="auto" />
      <audio ref={urgentAudioRef} src="/notification-urgent.mp3" preload="auto" />
    </AdminLayout>
  );
}
