import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import api from '../api';
import { Bell, MapPin, CheckCircle, Package, Clock, Phone, XCircle, ChevronLeft, ChevronRight, CheckSquare, Square, Trash2, Wifi, WifiOff } from 'lucide-react';
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
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function Dashboard() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [storeId, setStoreId] = useState<number | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [alertQueue, setAlertQueue] = useState<Order[]>([]);
  const [rejectTarget, setRejectTarget] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState("PENDING");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [connected, setConnected] = useState(true);
  const [tick, setTick] = useState(0);
  const ITEMS_PER_PAGE = 8;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urgentAudioRef = useRef<HTMLAudioElement | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const columns = [
    { title: 'Por Aprobar', status: 'AWAITING_PAYMENT', headerClass: 'bg-yellow-50/50 text-yellow-950 border-yellow-100', badgeClass: 'bg-yellow-100 text-yellow-700' },
    { title: 'Nuevas', status: 'PENDING', headerClass: 'bg-orange-50/50 text-orange-950 border-orange-100', badgeClass: 'bg-orange-100 text-orange-700' },
    { title: 'Preparando', status: 'ACCEPTED', headerClass: 'bg-blue-50/50 text-blue-950 border-blue-100', badgeClass: 'bg-blue-100 text-blue-700' },
    { title: 'En Camino', status: 'DISPATCHED', headerClass: 'bg-purple-50/50 text-purple-950 border-purple-100', badgeClass: 'bg-purple-100 text-purple-700' }
  ];

  const pendingUnread = orders.filter(o => (o.status === 'PENDING' || o.status === 'AWAITING_PAYMENT') && !o.viewed).length;

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!slug) return;
    try {
      const res = await api.get(`/stores/${slug}/orders`);
      setOrders(res.data);
    } catch (error) {
      console.error("Error cargando dashboard", error);
    }
  }, [slug]);

  useEffect(() => {
    fetchOrders();
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [fetchOrders]);

  useEffect(() => {
    if (!storeId) return;

    const socketURL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
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

        const pendingCount = orders.filter(o => o.status === 'PENDING' || o.status === 'AWAITING_PAYMENT').length;
        if (pendingCount >= 3 && urgentAudioRef.current) {
          urgentAudioRef.current.play().catch(() => {});
        } else if (audioRef.current) {
          audioRef.current.play().catch(() => {});
        }

        if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
          const notif = new Notification("¡Nuevo Pedido!", {
            body: `$${order.total_amount.toFixed(2)} - ${order.delivery_address.split(' |')[0]}`,
            icon: '/favicon.ico'
          });
          notif.onclick = () => { window.focus(); notif.close(); };
        }
      });

      socket.on('pedido_actualizado', (updatedOrder: Order) => {
        setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
        setAlertQueue(prev => prev.filter(o => o.id !== updatedOrder.id));
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
  }, [storeId, orders.length]);

  useEffect(() => {
    if (!slug) return;
    const interval = setInterval(() => {
      if (!socketRef.current?.connected) {
        fetchOrders();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [slug, fetchOrders]);

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

  const changeStatus = async (orderId: number, status: string, cancel_reason?: string, driver_id?: number) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status, cancel_reason, driver_id });
    } catch (error: any) {
      if (error?.response?.status === 409) {
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
  };

  const handleQuickReject = (order: Order) => {
    setRejectTarget(order);
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

  if (!storeId) return <div className="min-h-screen bg-background flex items-center justify-center font-bold text-muted-foreground">Cargando panel de control...</div>;

  return (
    <AdminLayout title="Panel de Despachos">
      <ConnectionStatus connected={connected} />

      {/* Cola de Alertas */}
      {alertQueue.length > 0 && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md border-0 shadow-2xl animate-in zoom-in-95 duration-300 bg-card overflow-hidden">
            <div className="h-2 w-full bg-primary animate-pulse" />
            {alertQueue.length > 1 && (
              <div className="bg-primary/10 text-center py-1.5">
                <span className="text-xs font-bold text-primary">{alertQueue.length - 1} pedido(s) más esperando</span>
              </div>
            )}
            <CardHeader className="text-center pt-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce">
                <Bell className="text-primary" size={32} />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-foreground">¡NUEVO PEDIDO!</h2>
              <p className="text-xs text-muted-foreground font-bold mt-1">
                Enter = Aprobar &middot; R = Rechazar &middot; Esc = Omitir
              </p>
            </CardHeader>
            <CardContent className="pb-6">
              <div className="bg-muted/30 p-4 rounded-xl text-left mb-4 space-y-2">
                <p className="text-sm font-bold flex items-center gap-2">
                  <MapPin size={14} className="text-primary" />
                  {alertQueue[0].delivery_address.split(' |')[0]}
                </p>
                <div className="border-t border-border pt-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
                    Artículos ({alertQueue[0].items.length})
                  </p>
                  <ul className="space-y-0.5">
                    {alertQueue[0].items.map(i => (
                      <li key={i.id} className="text-xs font-medium flex justify-between">
                        <span>{i.quantity}x {i.product.name}</span>
                        <span className="font-black">${(i.quantity * i.unit_price).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-widest font-bold text-center">Monto a cobrar</p>
              <span className="font-black text-primary text-4xl block mb-6 font-display tracking-tight text-center">
                ${alertQueue[0].total_amount.toFixed(2)}
              </span>
              <div className="flex gap-2">
                <Button
                  onClick={() => { setRejectTarget(alertQueue[0]); }}
                  variant="outline"
                  className="w-1/3 h-12 font-black text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 transition-all rounded-xl"
                >
                  <XCircle className="mr-1" size={18} /> Rechazar
                </Button>
                <Button
                  onClick={() => handleAcceptAlert(alertQueue[0].id)}
                  className="w-2/3 h-12 font-black bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30 transition-all rounded-xl"
                >
                  <CheckCircle className="mr-1" size={18} /> Aprobar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Barra de acciones masivas */}
      {selectMode && selectedIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-40 p-4 flex items-center justify-between">
          <span className="font-bold text-sm">{selectedIds.length} seleccionados</span>
          <div className="flex gap-2">
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
        <TabsList className="grid w-full grid-cols-4 h-16 md:h-14 bg-muted/40 rounded-xl p-1.5 gap-1 shadow-inner overflow-x-auto">
          {columns.map(col => {
            const count = orders.filter(o => o.status === col.status).length;
            const unreadCount = col.status === 'PENDING'
              ? orders.filter(o => o.status === 'PENDING' && !o.viewed).length
              : col.status === 'AWAITING_PAYMENT'
              ? orders.filter(o => o.status === 'AWAITING_PAYMENT' && !o.viewed).length
              : 0;
            return (
              <TabsTrigger
                key={col.status}
                value={col.status}
                className="h-full rounded-lg font-bold text-[9px] md:text-sm uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all whitespace-normal md:whitespace-nowrap flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-1 md:px-3 leading-tight"
              >
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
          const tabOrders = orders.filter(o => o.status === col.status);
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
                      <TableHead className="font-black uppercase tracking-wider text-[11px]">ID / Tiempo</TableHead>
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
                        <TableCell colSpan={selectMode ? 7 : 6} className="h-40 text-center">
                          <div className="flex flex-col items-center justify-center text-muted-foreground/60 space-y-3">
                            <Package size={40} className="opacity-40" />
                            <p className="font-bold text-sm tracking-wide">No hay pedidos en esta sección</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedOrders.map(order => {
                        const elapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
                        const isUrgent = elapsed > 10 && (order.status === 'PENDING' || order.status === 'AWAITING_PAYMENT');
                        return (
                        <TableRow
                          key={order.id}
                          className={`hover:bg-muted/40 transition-colors group ${!order.viewed && (order.status === 'PENDING' || order.status === 'AWAITING_PAYMENT') ? 'bg-primary/5' : ''} ${isUrgent ? 'border-l-4 border-l-red-500' : ''}`}
                          onClick={() => { markViewed(order.id); }}
                        >
                          {selectMode && col.status === 'PENDING' && (
                            <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                              <Checkbox checked={selectedIds.includes(order.id)} onCheckedChange={() => toggleSelect(order.id)} />
                            </TableCell>
                          )}
                          <TableCell className="align-top py-4">
                            <div className="flex items-center gap-2">
                              {!order.viewed && (order.status === 'PENDING' || order.status === 'AWAITING_PAYMENT') && (
                                <div className="w-2 h-2 bg-primary rounded-full animate-pulse flex-shrink-0" />
                              )}
                              <span className="text-foreground font-black text-sm">#{order.id}</span>
                            </div>
                            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1 mt-1">
                              <Clock size={12} />
                              {timeAgo(order.createdAt)}
                              {isUrgent && <span className="text-red-500 font-black ml-1">URGENTE</span>}
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
                            <div className="flex items-center justify-end gap-2">
                              {(order.status === 'PENDING' || order.status === 'AWAITING_PAYMENT') && (
                                <>
                                  <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 font-bold rounded-lg" onClick={(e) => { e.stopPropagation(); handleQuickReject(order); }}>
                                    <XCircle size={14} />
                                  </Button>
                                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 font-bold rounded-lg" onClick={(e) => { e.stopPropagation(); handleQuickApprove(order.id); }}>
                                    <CheckCircle size={14} />
                                  </Button>
                                </>
                              )}
                              <Button variant="secondary" size="sm" className="font-bold shadow-sm rounded-lg hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => navigate(`/admin/${slug}/order/${order.id}`)}>
                                Detalles
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
            <div className="md:hidden space-y-4 pb-6">
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
                  const elapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
                  const isUrgent = elapsed > 10 && (order.status === 'PENDING' || order.status === 'AWAITING_PAYMENT');
                  return (
                  <Card key={order.id} className={`bg-card border-border shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${isUrgent ? 'border-l-4 border-l-red-500' : ''}`}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-2">
                          {selectMode && col.status === 'PENDING' && (
                            <Checkbox checked={selectedIds.includes(order.id)} onCheckedChange={() => toggleSelect(order.id)} className="mt-1" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              {!order.viewed && (order.status === 'PENDING' || order.status === 'AWAITING_PAYMENT') && (
                                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                              )}
                              <p className="text-xs font-black text-primary">#{order.id}</p>
                            </div>
                            <p className="font-black text-lg leading-tight mt-0.5">{order.user.name || 'Sin Nombre'}</p>
                            <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1 mt-0.5"><Phone size={12} /> {order.user.phone}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs font-bold px-2 py-1 rounded-md inline-flex items-center gap-1 ${isUrgent ? 'bg-red-100 text-red-700' : 'bg-muted text-muted-foreground'}`}>
                            <Clock size={12} /> {timeAgo(order.createdAt)}
                          </p>
                          {isUrgent && <p className="text-[10px] font-black text-red-500 mt-1">URGENTE</p>}
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
                    <CardFooter className="p-3 bg-muted/30 border-t border-border flex justify-between">
                      {(order.status === 'PENDING' || order.status === 'AWAITING_PAYMENT') ? (
                        <div className="flex gap-2 w-full">
                          <Button variant="outline" size="sm" className="flex-1 font-bold text-red-600 border-red-200 hover:bg-red-50 rounded-lg" onClick={() => handleQuickReject(order)}>
                            <XCircle size={14} className="mr-1" /> Rechazar
                          </Button>
                          <Button size="sm" className="flex-1 font-bold bg-emerald-600 hover:bg-emerald-700 rounded-lg" onClick={() => handleQuickApprove(order.id)}>
                            <CheckCircle size={14} className="mr-1" /> Aprobar
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
