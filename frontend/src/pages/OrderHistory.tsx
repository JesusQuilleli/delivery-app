import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Printer, Trash2, Calendar, Search, History, ChevronLeft, ChevronRight, Download, Filter, TrendingUp, Award, Sparkles, PieChart as PieIcon, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, PieChart, Pie, Cell } from 'recharts';
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
  const [showCharts, setShowCharts] = useState(true);
  
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
  }, [slug, user?.id]);

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

      {/* F2H-03: Sección Avanzada de Beneficio Comercial, Gráficas y Margen de Ganancias */}
      {analytics && (
        <div className="space-y-6 mb-8 print:hidden">
          {/* Banner de Impacto Digital y Retorno de Inversión */}
          <div className="bg-gradient-to-r from-emerald-950 via-gray-900 to-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-xl border border-emerald-500/30">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  <Sparkles size={14} /> Impacto Comercial TiendaFast
                </span>
                <h4 className="text-xl font-black tracking-tight text-white">
                  Resultados Canalizados por la Aplicación
                </h4>
                <p className="text-xs text-gray-300 max-w-2xl leading-relaxed">
                  Ventas estructuradas y organizadas de forma automática, reduciendo pérdidas por pedidos informales en WhatsApp y agilizando la entrega a clientes.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
                <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Ticket Promedio</span>
                  <span className="text-lg font-black text-emerald-400">
                    {formatPrice(analytics.averageTicket || 0, storeConfig?.currency)}
                  </span>
                </div>
                <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Efectividad Entrega</span>
                  <span className="text-lg font-black text-emerald-400">
                    {analytics.totalOrders + (analytics.cancelledOrders || 0) > 0
                      ? Math.round((analytics.totalOrders / (analytics.totalOrders + (analytics.cancelledOrders || 0))) * 100)
                      : 100}%
                  </span>
                </div>
                <div className="bg-white/5 border border-white/10 p-3 rounded-xl col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Venta Neta Productos</span>
                  <span className="text-lg font-black text-emerald-400">
                    {formatPrice(analytics.totalNetSales || 0, storeConfig?.currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Gráficas Interactivas: Evolución de Ventas y Distribución de Pagos */}
          <div className="flex items-center justify-between">
            <h4 className="text-base font-black flex items-center gap-2 text-foreground">
              <BarChart2 className="text-primary" size={20} />
              Métricas y Comportamiento del Negocio
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCharts(!showCharts)}
              className="text-xs font-bold h-8"
            >
              {showCharts ? 'Ocultar Gráficas' : 'Mostrar Gráficas'}
            </Button>
          </div>

          {showCharts && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Gráfica de Área: Evolución de Ventas */}
              <Card className="lg:col-span-2 border-border shadow-sm p-5 bg-card rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h5 className="font-black text-sm text-foreground flex items-center gap-1.5">
                      <TrendingUp size={16} className="text-emerald-500" />
                      Evolución de Ingresos por Día
                    </h5>
                    <p className="text-xs text-muted-foreground">Últimos días con actividad de despachos entregados.</p>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground uppercase">
                    Moneda: {storeConfig?.currency || 'USD'}
                  </span>
                </div>

                {analytics.salesTimeline && analytics.salesTimeline.length > 0 ? (
                  <div className="h-64 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.salesTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                          </linearGradient>
                          <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="label" stroke="#888888" fontSize={11} tickLine={false} />
                        <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: '#1f2937', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                          formatter={(value: any) => [`${formatPrice(Number(value) || 0, storeConfig?.currency)}`]}
                        />
                        <Area type="monotone" dataKey="sales" name="Venta Total" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" />
                        <Area type="monotone" dataKey="netSales" name="Neto Productos" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#netGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-xs text-muted-foreground border border-dashed rounded-xl">
                    Aún no hay suficientes ventas entregadas para graficar la tendencia diaria.
                  </div>
                )}
              </Card>

              {/* Gráfica Circular: Métodos de Pago */}
              <Card className="border-border shadow-sm p-5 bg-card rounded-2xl flex flex-col justify-between">
                <div>
                  <h5 className="font-black text-sm text-foreground flex items-center gap-1.5 mb-1">
                    <PieIcon size={16} className="text-blue-500" />
                    Distribución de Pagos
                  </h5>
                  <p className="text-xs text-muted-foreground mb-4">Proporción de recaudación por canal.</p>

                  {analytics.paymentBreakdown && (analytics.paymentBreakdown.CASH.amount > 0 || analytics.paymentBreakdown.TRANSFER.amount > 0) ? (
                    <div>
                      <div className="h-44 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Efectivo', value: analytics.paymentBreakdown.CASH.amount, color: '#10b981' },
                                { name: 'Pago Móvil', value: analytics.paymentBreakdown.TRANSFER.amount, color: '#3b82f6' }
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={65}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              <Cell fill="#10b981" />
                              <Cell fill="#3b82f6" />
                            </Pie>
                            <RechartsTooltip
                              contentStyle={{ backgroundColor: '#1f2937', borderRadius: '10px', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                              formatter={(value: any) => [`${formatPrice(Number(value) || 0, storeConfig?.currency)}`]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t text-xs">
                        <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50">
                          <span className="font-bold text-emerald-800 dark:text-emerald-400 block">💵 Efectivo</span>
                          <span className="font-black text-sm text-emerald-900 dark:text-emerald-300">
                            {formatPrice(analytics.paymentBreakdown.CASH.amount, storeConfig?.currency)}
                          </span>
                          <span className="block text-[10px] text-muted-foreground">({analytics.paymentBreakdown.CASH.count} pedidos)</span>
                        </div>
                        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200/50">
                          <span className="font-bold text-blue-800 dark:text-blue-400 block">📱 Pago Móvil</span>
                          <span className="font-black text-sm text-blue-900 dark:text-blue-300">
                            {formatPrice(analytics.paymentBreakdown.TRANSFER.amount, storeConfig?.currency)}
                          </span>
                          <span className="block text-[10px] text-muted-foreground">({analytics.paymentBreakdown.TRANSFER.count} pedidos)</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-44 flex items-center justify-center text-xs text-muted-foreground border border-dashed rounded-xl">
                      Sin datos de pago suficientes.
                    </div>
                  )}
                </div>

                {analytics.topProducts && analytics.topProducts.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-2">
                      <Award size={14} className="text-amber-500" /> Top Productos Más Vendidos
                    </span>
                    <div className="space-y-1.5">
                      {analytics.topProducts.slice(0, 3).map((prod: any, idx: number) => (
                        <div key={prod.id} className="flex justify-between items-center text-xs">
                          <span className="font-bold text-foreground/90 truncate max-w-[150px]">
                            {idx + 1}. {prod.name}
                          </span>
                          <Badge variant="secondary" className="font-mono text-[10px] font-bold">
                            {prod.quantity} unids
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </div>
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
