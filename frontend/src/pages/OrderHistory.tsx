import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Printer, Trash2, Calendar, Search, History, ChevronLeft, ChevronRight, Download, Filter } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { toast } from 'sonner';
import { formatPrice } from '../utils/currency';

export default function OrderHistory() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [storeConfig, setStoreConfig] = useState<any>(null);

  const [showMonthSales, setShowMonthSales] = useState(false);
  const [showTotalSales, setShowTotalSales] = useState(false);
  const [showTotalOrders, setShowTotalOrders] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const totalPages = Math.max(1, Math.ceil(orders.length / ITEMS_PER_PAGE));
  const paginatedOrders = orders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const kpiCount = 1 + (showMonthSales ? 1 : 0) + (showTotalSales ? 1 : 0) + (showTotalOrders ? 1 : 0);
  const kpiGridClass = kpiCount === 4 ? 'xl:grid-cols-4' : kpiCount === 3 ? 'xl:grid-cols-3' : 'xl:grid-cols-2';

  const fetchHistory = async () => {
    setLoading(true);
    setCurrentPage(1);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('from', dateFrom);
      if (dateTo) params.append('to', dateTo);
      if (statusFilter && statusFilter !== 'ALL') params.append('status', statusFilter);
      if (paymentFilter && paymentFilter !== 'ALL') params.append('payment_method', paymentFilter);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const res = await api.get(`/stores/${slug}/history${queryStr}`);
      const data = Array.isArray(res.data) ? res.data : (res.data.orders || []);
      setOrders(data);
    } catch (error) {
      console.error("Error fetching history", error);
    }
    setLoading(false);
  };

  const fetchAnalytics = async () => {
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('from', dateFrom);
      if (dateTo) params.append('to', dateTo);
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const res = await api.get(`/stores/${slug}/analytics${queryStr}`);
      setAnalytics(res.data);
    } catch (error) {
      console.error("Error fetching analytics", error);
    }
  };

  const handleApplyFilters = () => {
    fetchHistory();
    fetchAnalytics();
  };

  useEffect(() => {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      navigate('/admin-login');
      return;
    }

    fetchHistory();
    fetchAnalytics();
    api.get(`/stores/${slug}/products?limit=1`).then(res => {
      if (res.data.store) setStoreConfig(res.data.store);
    }).catch(e => console.error(e));
  }, [slug, navigate, user]);

  const deleteOrder = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar permanentemente esta orden del historial?')) {
      try {
        await api.delete(`/orders/${id}`);
        setOrders(orders.filter(o => o.id !== id));
        toast.success('Orden eliminada correctamente');
      } catch (error) {
        console.error(error);
        toast.error('Error eliminando la orden');
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (!orders || orders.length === 0) {
      toast.error('No hay órdenes para exportar.');
      return;
    }

    const headers = [
      'ID Pedido',
      'Fecha',
      'Cliente',
      'Teléfono',
      'Dirección',
      'Método de Pago',
      'Referencia',
      'Subtotal',
      'Delivery',
      'Total',
      'Estado'
    ];

    const rows = orders.map((o) => {
      const escape = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
      return [
        o.id,
        escape(new Date(o.createdAt).toLocaleString()),
        escape(o.user?.name || 'Sin Nombre'),
        escape(o.user?.phone || ''),
        escape(o.delivery_address || ''),
        escape(o.payment_method === 'CASH' ? 'Efectivo' : 'Pago Móvil'),
        escape(o.payment_reference || ''),
        Number(o.subtotal || o.total_amount).toFixed(2),
        Number(o.delivery_fee || 0).toFixed(2),
        Number(o.total_amount).toFixed(2),
        escape(o.status === 'DELIVERED' ? 'COMPLETADO' : 'CANCELADO')
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_ventas_${slug}_${dateFrom || 'inicio'}_${dateTo || 'fin'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Reporte exportado en formato CSV');
  };

  return (
    <AdminLayout title="Historial de Órdenes">

      {/* Selector de Métricas (Solo pantalla) */}
      <div className="mb-4 flex flex-wrap gap-2 print:hidden items-center text-sm font-bold text-muted-foreground">
        <span className="mr-2">Mostrar métricas adicionales:</span>
        <button 
          onClick={() => setShowMonthSales(!showMonthSales)}
          className={`px-3 py-1.5 rounded-lg transition-colors border ${showMonthSales ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-card border-border hover:bg-muted'}`}
        >
          📅 Ventas del Mes
        </button>
        <button 
          onClick={() => setShowTotalSales(!showTotalSales)}
          className={`px-3 py-1.5 rounded-lg transition-colors border ${showTotalSales ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-card border-border hover:bg-muted'}`}
        >
          📈 Histórico Total
        </button>
        <button 
          onClick={() => setShowTotalOrders(!showTotalOrders)}
          className={`px-3 py-1.5 rounded-lg transition-colors border ${showTotalOrders ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-card border-border hover:bg-muted'}`}
        >
          📦 Pedidos Entregados
        </button>
      </div>

      {/* Tarjetas de Estadísticas (KPIs) */}
      {analytics && (
        <div className={`grid grid-cols-1 md:grid-cols-2 ${kpiGridClass} gap-4 mb-8`}>
          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-none shadow-lg shadow-emerald-500/20">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-emerald-100 font-bold uppercase tracking-wider text-xs mb-1">
                    {analytics.filtered ? 'Ventas en Período' : 'Ventas de Hoy'}
                  </p>
                  <h3 className="text-3xl font-black">
                    {formatPrice(analytics.filtered ? analytics.filtered.sales : analytics.todaySales, storeConfig?.currency)}
                  </h3>
                  {analytics.filtered ? (
                    <p className="text-xs text-emerald-100 font-semibold mt-1">
                      {analytics.filtered.orders} pedidos entregados
                    </p>
                  ) : analytics.todayNetSales !== undefined ? (
                    <p className="text-xs text-emerald-100 font-semibold mt-1">
                      Neto productos: {formatPrice(analytics.todayNetSales, storeConfig?.currency)}
                    </p>
                  ) : null}
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <span className="text-xl">💰</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {showMonthSales && (
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-lg shadow-blue-500/20">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-blue-100 font-bold uppercase tracking-wider text-xs mb-1">Ventas del Mes</p>
                    <h3 className="text-3xl font-black">{formatPrice(analytics.monthSales, storeConfig?.currency)}</h3>
                    {analytics.monthNetSales !== undefined && (
                      <p className="text-xs text-blue-100 font-semibold mt-1">
                        Neto: {formatPrice(analytics.monthNetSales, storeConfig?.currency)} ({analytics.monthOrders || 0} pedidos)
                      </p>
                    )}
                  </div>
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <span className="text-xl">📅</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {showTotalSales && (
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-none shadow-lg shadow-purple-500/20">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-purple-100 font-bold uppercase tracking-wider text-xs mb-1">Histórico Total</p>
                    <h3 className="text-3xl font-black">{formatPrice(analytics.totalSales, storeConfig?.currency)}</h3>
                    {analytics.totalNetSales !== undefined && (
                      <p className="text-xs text-purple-100 font-semibold mt-1">
                        Neto productos: {formatPrice(analytics.totalNetSales, storeConfig?.currency)}
                      </p>
                    )}
                  </div>
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <span className="text-xl">📈</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {showTotalOrders && (
            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-none shadow-lg shadow-orange-500/20">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-orange-100 font-bold uppercase tracking-wider text-xs mb-1">Pedidos Entregados</p>
                    <h3 className="text-3xl font-black">{analytics.totalOrders}</h3>
                    {analytics.cancelledOrders !== undefined && (
                      <p className="text-xs text-orange-100 font-semibold mt-1">
                        Cancelados: {analytics.cancelledOrders}
                      </p>
                    )}
                  </div>
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <span className="text-xl">📦</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      
      {/* Filtros - Ocultos en impresión */}
      <Card className="mb-8 print:hidden border border-border shadow-sm bg-card">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={14}/> Desde
              </label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-background border-border h-10" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={14}/> Hasta
              </label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-background border-border h-10" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Filter size={14}/> Estado
              </label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-background border border-border text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="ALL">Todos los estados</option>
                <option value="DELIVERED">Solo Completados</option>
                <option value="CANCELLED">Solo Cancelados</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Filter size={14}/> Método de Pago
              </label>
              <select
                value={paymentFilter}
                onChange={e => setPaymentFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-background border border-border text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="ALL">Todos los métodos</option>
                <option value="CASH">Efectivo</option>
                <option value="TRANSFER">Pago Móvil</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-2 border-t border-border">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Buscar por cliente, teléfono o #ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleApplyFilters(); }}
                className="pl-9 h-10 bg-background border-border text-sm"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button onClick={handleApplyFilters} className="h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 flex-1 sm:flex-initial rounded-lg">
                <Search className="mr-2" size={16} /> Filtrar
              </Button>
              <Button variant="outline" onClick={handleExportCsv} className="h-10 font-bold gap-2 text-sm border-border text-foreground hover:bg-muted flex-1 sm:flex-initial rounded-lg">
                <Download size={16} /> CSV
              </Button>
              <Button variant="outline" className="h-10 font-bold gap-2 text-sm border-primary text-primary hover:bg-primary/10 flex-1 sm:flex-initial rounded-lg" onClick={handlePrint}>
                <Printer size={16} /> Imprimir
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Título solo visible en impresión */}
      <div className="hidden print:block text-center mb-8 border-b-2 pb-4 border-black">
        <h1 className="text-2xl font-black">REPORTE DE VENTAS - {slug?.toUpperCase()}</h1>
        <p className="text-sm">{dateFrom && dateTo ? `Periodo: ${dateFrom} al ${dateTo}` : 'Historial Completo'}</p>
        <p className="text-xs mt-1">Fecha de impresión: {new Date().toLocaleString()}</p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground font-bold flex flex-col items-center justify-center gap-2">
          <History className="animate-spin text-primary" size={32} />
          Cargando historial...
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground font-bold bg-muted/30 rounded-2xl border-dashed border border-border flex flex-col items-center justify-center gap-2">
          <Search size={32} className="opacity-50" />
          No hay órdenes en este periodo.
        </div>
      ) : (
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden print:border-none print:shadow-none print:bg-white">
          {/* Vista móvil: tarjetas de órdenes */}
          <div className="md:hidden divide-y divide-border">
            {paginatedOrders.map(order => (
              <div key={order.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black text-foreground">#{order.id}</span>
                  <Badge variant="outline" className={order.status === 'DELIVERED' ? 'text-emerald-700 border-emerald-200 bg-emerald-500/10' : 'text-destructive border-destructive/20 bg-destructive/10'}>
                    {order.status === 'DELIVERED' ? 'COMPLETADO' : 'CANCELADO'}
                  </Badge>
                </div>
                <div>
                  <p className="font-bold text-foreground">{order.user.name || 'Sin Nombre'}</p>
                  <p className="text-xs text-primary font-semibold">{order.user.phone}</p>
                  <p className="text-xs text-muted-foreground font-medium">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground/80">
                    {order.payment_method === 'CASH' ? 'Efectivo' : 'Pago Móvil'}
                    {order.payment_reference && <span className="block text-xs text-muted-foreground">Ref: {order.payment_reference}</span>}
                  </span>
                  <span className="font-black text-primary">{formatPrice(order.total_amount, storeConfig?.currency)}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => deleteOrder(order.id)} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 size={16} /> Eliminar
                </Button>
              </div>
            ))}
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-muted/50 border-b border-border print:bg-white print:border-black">
                <tr>
                  <th className="p-4 font-black text-muted-foreground uppercase tracking-wider text-xs">ID</th>
                  <th className="p-4 font-black text-muted-foreground uppercase tracking-wider text-xs">Fecha</th>
                  <th className="p-4 font-black text-muted-foreground uppercase tracking-wider text-xs">Cliente</th>
                  <th className="p-4 font-black text-muted-foreground uppercase tracking-wider text-xs">Método</th>
                  <th className="p-4 font-black text-muted-foreground uppercase tracking-wider text-xs">Monto</th>
                  <th className="p-4 font-black text-muted-foreground uppercase tracking-wider text-xs">Estado</th>
                  <th className="p-4 font-black text-muted-foreground uppercase tracking-wider text-xs text-center print:hidden">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border print:divide-black">
                {paginatedOrders.map(order => (
                  <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4 font-black text-foreground">#{order.id}</td>
                    <td className="p-4 text-muted-foreground font-medium">{new Date(order.createdAt).toLocaleString()}</td>
                    <td className="p-4">
                      <p className="font-bold text-foreground">{order.user.name || 'Sin Nombre'}</p>
                      <p className="text-xs text-primary font-semibold">{order.user.phone}</p>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-foreground/80">{order.payment_method === 'CASH' ? 'Efectivo' : 'Pago Móvil'}</span>
                      {order.payment_reference && <span className="block text-xs text-muted-foreground mt-0.5">Ref: {order.payment_reference}</span>}
                    </td>
                    <td className="p-4 font-black text-primary text-base">{formatPrice(order.total_amount, storeConfig?.currency)}</td>
                    <td className="p-4">
                      <Badge variant="outline" className={order.status === 'DELIVERED' ? 'text-emerald-700 border-emerald-200 bg-emerald-500/10' : 'text-destructive border-destructive/20 bg-destructive/10'}>
                        {order.status === 'DELIVERED' ? 'COMPLETADO' : 'CANCELADO'}
                      </Badge>
                    </td>
                    <td className="p-4 text-center print:hidden">
                      <Button variant="ghost" size="sm" onClick={() => deleteOrder(order.id)} className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8 p-0">
                        <Trash2 size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-muted/30 p-6 border-t border-border flex justify-end items-center gap-4 print:bg-white print:border-black flex-wrap">
            <span className="text-muted-foreground font-bold uppercase tracking-widest text-sm">Total Recaudado:</span>
            <span className="text-3xl sm:text-4xl font-black text-foreground font-display">
              {formatPrice(orders.filter(o => o.status === 'DELIVERED').reduce((acc, o) => acc + o.total_amount, 0), storeConfig?.currency)}
            </span>
          </div>
          
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 p-4 print:hidden">
              <Button variant="outline" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-xl border-border">
                <ChevronLeft size={20} />
              </Button>
              <span className="font-bold text-muted-foreground text-sm">Página {currentPage} de {totalPages}</span>
              <Button variant="outline" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded-xl border-border">
                <ChevronRight size={20} />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Estilos para impresión */}
      <style>{`
        @media print {
          body { background: white; color: black; }
          .print\\\\:hidden { display: none !important; }
          .print\\\\:block { display: block !important; }
        }
      `}</style>
    </AdminLayout>
  );
}
