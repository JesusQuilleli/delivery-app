import { useEffect, useState, useContext } from 'react';
import api from '../api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import {
  Store,
  Plus,
  ShieldAlert,
  Power,
  Loader2,
  LogOut,
  ExternalLink,
  DollarSign,
  Calendar,
  CreditCard,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Trash2,
  MessageSquare,
  Mail
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthContext } from '../context/AuthContext';

interface StoreItem {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  industry: string;
  plan: string;
  plan_price: number;
  billing_cycle: string;
  subscription_status: string;
  trial_ends_at: string | null;
  next_billing_date: string | null;
  subscription_notes: string | null;
  users?: { id: number; username: string; phone: string }[];
  _count?: { products: number; orders: number };
  product_usage?: { current: number; limit: number; percentage: number };
  last_payment?: {
    id: number;
    amount: number;
    currency: string;
    payment_method: string;
    payment_reference: string;
    period_start: string;
    period_end: string;
    created_at: string;
  } | null;
}

interface SubscriptionSummary {
  mrr: number;
  activeCount: number;
  trialCount: number;
  pastDueCount: number;
  suspendedCount: number;
  totalStores: number;
}

export default function SuperAdmin() {
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [summary, setSummary] = useState<SubscriptionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  // Formulario creación
  const [storeName, setStoreName] = useState('');
  const [slug, setSlug] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [resetModalData, setResetModalData] = useState<any | null>(null);
  const [resettingId, setResettingId] = useState<number | null>(null);
  const [industry, setIndustry] = useState('PHARMACY');
  const [selectedPlan, setSelectedPlan] = useState('EMPRENDEDOR');
  const [trialDays, setTrialDays] = useState(30);
  const [themeColor, setThemeColor] = useState('blue');
  const [creating, setCreating] = useState(false);

  // Modal Gestión de Plan
  const [editingStore, setEditingStore] = useState<StoreItem | null>(null);
  const [editPlan, setEditPlan] = useState('EMPRENDEDOR');
  const [editPrice, setEditPrice] = useState('15');
  const [editStatus, setEditStatus] = useState('ACTIVE');
  const [editTrialEnd, setEditTrialEnd] = useState('');
  const [editReason, setEditReason] = useState('');
  const [savingPlan, setSavingPlan] = useState(false);

  // Modal Registrar Pago
  const [payingStore, setPayingStore] = useState<StoreItem | null>(null);
  const [payAmount, setPayAmount] = useState('15');
  const [payCurrency, setPayCurrency] = useState('USD');
  const [payMethod, setPayMethod] = useState('PAGO_MOVIL');
  const [payRef, setPayRef] = useState('');
  const [payPeriodStart, setPayPeriodStart] = useState(() => new Date().toISOString().slice(0, 10));
  const [payPeriodEnd, setPayPeriodEnd] = useState(() => {
    const next = new Date();
    next.setMonth(next.getMonth() + 1);
    return next.toISOString().slice(0, 10);
  });
  const [payNotes, setPayNotes] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  // Modal Recibo
  const [receiptStore, setReceiptStore] = useState<StoreItem | null>(null);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/superadmin/subscriptions');
      setStores(res.data.stores || []);
      setSummary(res.data.summary || null);
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error('Acceso denegado. No eres Super Administrador.');
        navigate('/admin-login');
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/admin-login', { replace: true });
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/superadmin/stores', {
        storeName,
        slug,
        adminUsername,
        adminEmail,
        adminPhone,
        adminPassword,
        industry,
        theme_color: themeColor,
        plan: selectedPlan,
        trialDays: Number(trialDays)
      });
      toast.success('¡Tienda creada exitosamente! Credenciales de acceso despachadas al correo del dueño.');
      setStoreName(''); setSlug(''); setAdminUsername(''); setAdminEmail(''); setAdminPhone(''); setAdminPassword('');
      fetchSubscriptions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al crear la tienda.');
      console.error(error);
    } finally {
      setCreating(false);
    }
  };

  const handleResetPassword = async (store: any) => {
    if (!window.confirm(`¿Seguro que deseas restablecer la contraseña para '${store.name}'?`)) return;
    setResettingId(store.id);
    try {
      const res = await api.post(`/superadmin/stores/${store.id}/reset-password`);
      setResetModalData(res.data);
      toast.success(res.data.message);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al restablecer contraseña');
    }
    setResettingId(null);
  };

  const handleDeleteStore = async (store: StoreItem) => {
    const confirmMsg = `¿ESTÁS SEGURO de eliminar permanentemente la tienda "${store.name}"?\n\nEsta acción borrará:\n- Todo su catálogo y categorías\n- Todos sus pedidos y cotizaciones\n- Suscriptores, repartidores y usuarios\n\nEscribe el slug "${store.slug}" para confirmar la eliminación:`;
    const input = window.prompt(confirmMsg);
    if (!input) return;
    if (input.trim() !== store.slug.trim()) {
      toast.error('El slug no coincide. Eliminación cancelada.');
      return;
    }
    try {
      await api.delete(`/superadmin/stores/${store.id}`);
      toast.success(`Tienda "${store.name}" eliminada permanentemente`);
      fetchSubscriptions();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Error al eliminar la tienda');
    }
  };

  const toggleStatus = async (id: number) => {
    const reason = window.prompt('Indica el motivo de activación/pausa (opcional):') || undefined;
    try {
      await api.put(`/superadmin/stores/${id}/status`, { reason });
      toast.success('Estado actualizado');
      fetchSubscriptions();
    } catch (e) {
      console.error(e);
      toast.error('Error al cambiar el estado.');
    }
  };

  const openPlanModal = (store: StoreItem) => {
    setEditingStore(store);
    setEditPlan(store.plan || 'EMPRENDEDOR');
    setEditPrice(String(store.plan_price || 15));
    setEditStatus(store.subscription_status || 'TRIAL');
    setEditTrialEnd(store.trial_ends_at ? store.trial_ends_at.slice(0, 10) : '');
    setEditReason('');
  };

  const savePlanChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStore) return;
    setSavingPlan(true);
    try {
      await api.put(`/superadmin/stores/${editingStore.id}/subscription`, {
        plan: editPlan,
        plan_price: Number(editPrice),
        subscription_status: editStatus,
        trial_ends_at: editTrialEnd ? new Date(editTrialEnd).toISOString() : null,
        reason: editReason
      });
      toast.success('Suscripción y plan actualizados.');
      setEditingStore(null);
      fetchSubscriptions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al actualizar suscripción');
    } finally {
      setSavingPlan(false);
    }
  };

  const openPaymentModal = (store: StoreItem) => {
    setPayingStore(store);
    setPayAmount(String(store.plan_price || 15));
    setPayCurrency('USD');
    setPayMethod('PAGO_MOVIL');
    setPayRef('');
    setPayPeriodStart(new Date().toISOString().slice(0, 10));
    const next = new Date();
    next.setMonth(next.getMonth() + 1);
    setPayPeriodEnd(next.toISOString().slice(0, 10));
    setPayNotes('');
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingStore) return;
    setSavingPayment(true);
    try {
      await api.post(`/superadmin/stores/${payingStore.id}/payments`, {
        amount: Number(payAmount),
        currency: payCurrency,
        payment_method: payMethod,
        payment_reference: payRef,
        period_start: new Date(payPeriodStart).toISOString(),
        period_end: new Date(payPeriodEnd).toISOString(),
        notes: payNotes
      });
      toast.success('Pago de suscripción registrado exitosamente.');
      setPayingStore(null);
      fetchSubscriptions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error registrando pago');
    } finally {
      setSavingPayment(false);
    }
  };

  const copyReminderText = (store: StoreItem) => {
    const text = `Hola *${store.name}*, te saludamos de *TiendaFast*. Te recordamos que tu período de suscripción (Plan ${store.plan}) vence el ${store.next_billing_date ? new Date(store.next_billing_date).toLocaleDateString() : 'próximamente'}. El monto a renovar es de $${store.plan_price} USD (o al cambio oficial BCV). Para mantener activo tu catálogo y delivery, indícanos tu comprobante. ¡Gracias por confiar en nosotros!`;
    navigator.clipboard.writeText(text);
    toast.success('Mensaje copiado al portapapeles listo para WhatsApp');
  };

  const generateSlug = (name: string) => {
    setStoreName(name);
    setSlug(name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, ''));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center flex-shrink-0">
              <ShieldAlert size={28} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">SuperAdmin & Facturación SaaS</h1>
              <p className="text-gray-500 font-medium text-sm">Control central de clientes, planes, MRR y estados de suscripción.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={fetchSubscriptions} className="gap-2 font-bold" disabled={loading}>
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Actualizar
            </Button>
            <Button variant="destructive" onClick={handleLogout} className="gap-2 font-bold">
              <LogOut size={16} />
              Cerrar Sesión
            </Button>
          </div>
        </div>

        {/* SaaS KPIs Cards (F2B-09) */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs uppercase tracking-wider font-bold opacity-90">MRR Mensual</p>
                    <h3 className="text-3xl font-black mt-1">${summary.mrr} <span className="text-xs font-normal opacity-80">USD/mes</span></h3>
                  </div>
                  <div className="p-2.5 bg-white/20 rounded-xl">
                    <DollarSign size={22} />
                  </div>
                </div>
                <p className="text-xs mt-3 opacity-90 font-medium">{summary.activeCount} tiendas activas de pago</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-none shadow-sm bg-white">
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs uppercase tracking-wider font-bold text-gray-400">En Prueba Gratuita</p>
                    <h3 className="text-3xl font-black text-blue-600 mt-1">{summary.trialCount}</h3>
                  </div>
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                    <Calendar size={22} />
                  </div>
                </div>
                <p className="text-xs mt-3 text-gray-500 font-medium">Pilotos y onboarding</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-none shadow-sm bg-white">
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs uppercase tracking-wider font-bold text-gray-400">Por Vencer / Vencidas</p>
                    <h3 className="text-3xl font-black text-amber-600 mt-1">{summary.pastDueCount}</h3>
                  </div>
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                    <AlertTriangle size={22} />
                  </div>
                </div>
                <p className="text-xs mt-3 text-gray-500 font-medium">Requieren recordatorio</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-none shadow-sm bg-white">
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs uppercase tracking-wider font-bold text-gray-400">Suspendidas / Pausa</p>
                    <h3 className="text-3xl font-black text-gray-700 mt-1">{summary.suspendedCount}</h3>
                  </div>
                  <div className="p-2.5 bg-gray-100 text-gray-600 rounded-xl">
                    <Power size={22} />
                  </div>
                </div>
                <p className="text-xs mt-3 text-gray-500 font-medium">Total: {summary.totalStores} negocios</p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Asistente de Alta SaaS (F2B-07) */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg border-0 rounded-2xl sticky top-8">
              <CardHeader className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-t-2xl">
                <CardTitle className="flex items-center gap-2"><Plus size={20} /> Asistente de Alta SaaS</CardTitle>
                <CardDescription className="text-gray-300">Registra un nuevo negocio con catálogo inicial y plan.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleCreateStore} className="space-y-4">
                  
                  <div className="space-y-1.5">
                    <Label className="font-bold text-gray-700 text-xs">Nombre del Negocio</Label>
                    <Input required value={storeName} onChange={(e) => generateSlug(e.target.value)} placeholder="Ej: Farmacia Central" className="h-10 bg-gray-50" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-bold text-gray-700 text-xs">URL / Slug</Label>
                    <Input required value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="farmacia-central" className="h-10 bg-gray-50" />
                    <p className="text-[11px] text-gray-400 font-mono">tiendafast.com/{slug}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="font-bold text-gray-700 text-xs">Tipo de Negocio</Label>
                      <select 
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        className="w-full h-10 rounded-md border border-input bg-gray-50 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="PHARMACY">Farmacia</option>
                        <option value="RESTAURANT">Restaurante</option>
                        <option value="SUPERMARKET">Supermercado</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-bold text-gray-700 text-xs">Plan SaaS</Label>
                      <select 
                        value={selectedPlan}
                        onChange={(e) => setSelectedPlan(e.target.value)}
                        className="w-full h-10 rounded-md border border-input bg-gray-50 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="EMPRENDEDOR">Emprendedor ($9)</option>
                        <option value="NEGOCIO">Negocio ($19)</option>
                        <option value="PRO">Pro / Cadena ($35)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-bold text-gray-700 text-xs">Días de Prueba Inicial</Label>
                    <Input type="number" min={0} max={90} value={trialDays} onChange={(e) => setTrialDays(Number(e.target.value))} className="h-10 bg-gray-50" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-bold text-gray-700 text-xs">Color Principal (Tema)</Label>
                    <div className="flex gap-2.5 mt-1">
                      {[
                        { id: 'blue', hex: '#2563eb' },
                        { id: 'red', hex: '#dc2626' },
                        { id: 'green', hex: '#16a34a' },
                        { id: 'purple', hex: '#9333ea' },
                        { id: 'orange', hex: '#ea580c' },
                        { id: 'coral', hex: '#f43f5e' }
                      ].map(color => (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => setThemeColor(color.id)}
                          className={`w-7 h-7 rounded-full border-2 transition-all ${themeColor === color.id ? 'border-gray-900 scale-110 shadow-md' : 'border-transparent opacity-80 hover:opacity-100'}`}
                          style={{ backgroundColor: color.hex }}
                        />
                      ))}
                    </div>
                  </div>

                  <hr className="my-3" />
                  <p className="font-black text-xs text-gray-400 uppercase tracking-wider">Cuenta de Administración</p>

                  <div className="space-y-1.5">
                    <Label className="font-bold text-gray-700 text-xs">Usuario</Label>
                    <Input required value={adminUsername} onChange={(e) => setAdminUsername(e.target.value)} placeholder="admin_tienda" className="h-10 bg-gray-50" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-bold text-gray-700 text-xs flex items-center gap-1.5 text-emerald-800">
                      <Mail size={14} className="text-emerald-600" /> Correo Electrónico del Dueño (Para credenciales)
                    </Label>
                    <Input 
                      required 
                      type="email" 
                      value={adminEmail} 
                      onChange={(e) => setAdminEmail(e.target.value)} 
                      placeholder="dueno@negocio.com" 
                      className="h-10 bg-emerald-50/40 border-emerald-300 focus:border-emerald-500 font-medium" 
                    />
                    <p className="text-[11px] text-gray-500">Al registrarse, recibirá automáticamente sus credenciales, URL de acceso y detalles del plan.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-bold text-gray-700 text-xs">Teléfono (WhatsApp)</Label>
                    <Input 
                      required 
                      value={adminPhone} 
                      onChange={(e) => {
                        const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                        setAdminPhone(clean.startsWith('58') ? '+' + clean : '+58' + clean);
                      }} 
                      placeholder="+584141234567" 
                      className="h-10 bg-gray-50" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-bold text-gray-700 text-xs">Contraseña</Label>
                    <div className="relative">
                      <Input 
                        required 
                        type={showAdminPassword ? "text" : "password"} 
                        value={adminPassword} 
                        onChange={(e) => setAdminPassword(e.target.value)} 
                        className="h-10 bg-gray-50 pr-10" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPassword(prev => !prev)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700 transition"
                      >
                        {showAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" disabled={creating} className="w-full h-11 text-base font-black bg-blue-600 hover:bg-blue-700 rounded-xl mt-3">
                    {creating ? <Loader2 className="animate-spin" /> : 'Dar de Alta Tienda'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Tiendas y Suscripciones (F2B-03) */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0 rounded-2xl">
              <CardHeader className="bg-white border-b border-gray-100 rounded-t-2xl flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl"><Store className="text-blue-600" /> Clientes y Suscripciones ({stores.length})</CardTitle>
                  <CardDescription className="text-xs mt-1">Gestión de planes, límites de catálogo y control de cobro.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50/70">
                      <TableRow>
                        <TableHead className="font-black text-gray-900 pl-6">Negocio</TableHead>
                        <TableHead className="font-black text-gray-900">Plan / Cupo</TableHead>
                        <TableHead className="font-black text-gray-900">Estado SaaS</TableHead>
                        <TableHead className="font-black text-gray-900">Próx. Cobro</TableHead>
                        <TableHead className="font-black text-gray-900 text-right pr-6">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-12 font-bold text-gray-400">Cargando suscripciones...</TableCell></TableRow>
                      ) : stores.map(store => {
                        const statusBadge = {
                          ACTIVE: <Badge className="bg-emerald-500 font-bold">ACTIVA</Badge>,
                          TRIAL: <Badge className="bg-blue-500 font-bold">PRUEBA</Badge>,
                          PAST_DUE: <Badge className="bg-amber-500 font-bold">POR VENCER</Badge>,
                          SUSPENDED: <Badge className="bg-red-500 font-bold">SUSPENDIDA</Badge>,
                          CANCELLED: <Badge className="bg-gray-400 font-bold">CANCELADA</Badge>
                        }[store.subscription_status] || <Badge>{store.subscription_status}</Badge>;

                        return (
                          <TableRow key={store.id} className="hover:bg-gray-50/50">
                            <TableCell className="pl-6 py-4">
                              <p className="font-black text-base text-gray-900">{store.name}</p>
                              <a href={`/${store.slug}`} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1 font-mono mt-0.5">
                                /{store.slug} <ExternalLink size={10} />
                              </a>
                              {store.users?.[0] && (
                                <p className="text-[11px] text-gray-500 font-medium mt-1">
                                  @{store.users[0].username} • {store.users[0].phone}
                                </p>
                              )}
                            </TableCell>

                            <TableCell>
                              <Badge variant="outline" className="font-black text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
                                {store.plan}
                              </Badge>
                              {store.product_usage && (
                                <div className="mt-1.5 w-28">
                                  <div className="flex justify-between text-[10px] text-gray-500 font-semibold mb-0.5">
                                    <span>{store.product_usage.current} prods</span>
                                    <span>max {store.product_usage.limit}</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full ${store.product_usage.percentage > 90 ? 'bg-red-500' : 'bg-blue-500'}`}
                                      style={{ width: `${store.product_usage.percentage}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                            </TableCell>

                            <TableCell>
                              <div className="space-y-1">
                                {statusBadge}
                                {!store.is_active && (
                                  <p className="text-[10px] text-red-500 font-bold">Tienda en pausa</p>
                                )}
                              </div>
                            </TableCell>

                            <TableCell className="text-xs text-gray-600 font-medium">
                              {store.next_billing_date ? (
                                <span>{new Date(store.next_billing_date).toLocaleDateString()}</span>
                              ) : store.trial_ends_at ? (
                                <span className="text-blue-600 font-bold">Fin prueba: {new Date(store.trial_ends_at).toLocaleDateString()}</span>
                              ) : (
                                <span className="text-gray-400">Sin definir</span>
                              )}
                            </TableCell>

                            <TableCell className="text-right pr-6">
                              <div className="flex gap-1.5 justify-end">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => openPaymentModal(store)}
                                  title="Registrar Pago"
                                  className="h-8 px-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
                                >
                                  <CreditCard size={13} className="mr-1" />
                                  Cobro
                                </Button>

                                {store.last_payment && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setReceiptStore(store)}
                                    title="Ver Último Recibo"
                                    className="h-8 px-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200"
                                  >
                                    <Receipt size={13} className="mr-1" />
                                    Recibo
                                  </Button>
                                )}

                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => openPlanModal(store)}
                                  title="Gestionar Plan"
                                  className="h-8 px-2 text-xs font-bold"
                                >
                                  Plan
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyReminderText(store)}
                                  title="Copiar recordatorio WhatsApp"
                                  className="h-8 w-8 p-0"
                                >
                                  <Copy size={13} />
                                </Button>

                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  disabled={resettingId === store.id}
                                  onClick={() => handleResetPassword(store)}
                                  className="h-8 px-2 text-xs font-bold border-amber-300 text-amber-700 hover:bg-amber-50"
                                  title="Restablecer contraseña del administrador"
                                >
                                  <KeyRound size={12} className="mr-1" />
                                  {resettingId === store.id ? '...' : 'Clave'}
                                </Button>
                                <Button 
                                  variant={store.is_active ? "destructive" : "default"} 
                                  size="sm" 
                                  onClick={() => toggleStatus(store.id)}
                                  className={`h-8 px-2 text-xs font-bold ${!store.is_active ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                                  title={store.is_active ? 'Suspender tienda' : 'Reactivar tienda'}
                                >
                                  <Power size={12} className="mr-1" />
                                  {store.is_active ? 'Suspender' : 'Reactivar'}
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleDeleteStore(store)}
                                  className="h-8 px-2 text-xs font-bold border-rose-300 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                  title="Eliminar tienda permanentemente"
                                >
                                  <Trash2 size={12} className="mr-1" />
                                  Eliminar
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {stores.length === 0 && !loading && (
                        <TableRow><TableCell colSpan={5} className="text-center py-10 font-bold text-gray-400">No hay tiendas registradas.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>

      </div>

      {/* Modal: Gestionar Plan (F2B-04) */}
      {editingStore && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-white rounded-2xl shadow-2xl border-none">
            <CardHeader className="flex flex-row justify-between items-center border-b pb-4">
              <div>
                <CardTitle className="text-lg font-black">Plan SaaS: {editingStore.name}</CardTitle>
                <CardDescription className="text-xs">Modifica el plan comercial, precios y estado.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setEditingStore(null)} className="h-8 w-8 p-0">
                <X size={18} />
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={savePlanChanges} className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Plan</Label>
                  <select 
                    value={editPlan}
                    onChange={(e) => {
                      setEditPlan(e.target.value);
                      if (e.target.value === 'EMPRENDEDOR') setEditPrice('9');
                      if (e.target.value === 'NEGOCIO') setEditPrice('19');
                      if (e.target.value === 'PRO') setEditPrice('35');
                    }}
                    className="w-full h-10 rounded-md border border-input bg-gray-50 px-3 text-sm font-semibold"
                  >
                    <option value="EMPRENDEDOR">Emprendedor (Hasta 50 prods, $9/m)</option>
                    <option value="NEGOCIO">Negocio (Hasta 250 prods, $19/m)</option>
                    <option value="PRO">Pro / Cadena (Hasta 1000 prods, $35/m)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Precio Mensual ($ USD)</Label>
                    <Input type="number" step="0.01" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="h-10" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Estado Suscripción</Label>
                    <select 
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full h-10 rounded-md border border-input bg-gray-50 px-3 text-sm font-semibold"
                    >
                      <option value="TRIAL">Prueba (Trial)</option>
                      <option value="ACTIVE">Activa (Al día)</option>
                      <option value="PAST_DUE">Por Vencer / Vencida</option>
                      <option value="SUSPENDED">Suspendida por impago</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">Fin de Período de Prueba</Label>
                  <Input type="date" value={editTrialEnd} onChange={(e) => setEditTrialEnd(e.target.value)} className="h-10" />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">Motivo del Cambio (Auditoría)</Label>
                  <Input value={editReason} onChange={(e) => setEditReason(e.target.value)} placeholder="Ej: Renovación acordada, descuento comercial" className="h-10" />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <Button type="button" variant="outline" onClick={() => setEditingStore(null)}>Cancelar</Button>
                  <Button type="submit" disabled={savingPlan} className="font-bold">
                    {savingPlan ? <Loader2 className="animate-spin" /> : 'Guardar Cambios'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal: Registrar Pago (F2B-02) */}
      {payingStore && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-white rounded-2xl shadow-2xl border-none">
            <CardHeader className="flex flex-row justify-between items-center border-b pb-4">
              <div>
                <CardTitle className="text-lg font-black">Registrar Pago: {payingStore.name}</CardTitle>
                <CardDescription className="text-xs">Extiende el período activo y genera recibo.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setPayingStore(null)} className="h-8 w-8 p-0">
                <X size={18} />
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Monto</Label>
                    <Input type="number" step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} required className="h-10" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Moneda</Label>
                    <select 
                      value={payCurrency}
                      onChange={(e) => setPayCurrency(e.target.value)}
                      className="w-full h-10 rounded-md border border-input bg-gray-50 px-3 text-sm font-semibold"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="VES">Bolívares (Bs)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Método</Label>
                    <select 
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                      className="w-full h-10 rounded-md border border-input bg-gray-50 px-3 text-sm font-semibold"
                    >
                      <option value="PAGO_MOVIL">Pago Móvil</option>
                      <option value="TRANSFER">Transferencia</option>
                      <option value="CASH">Efectivo USD</option>
                      <option value="ZELLE">Zelle</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Referencia / Comprobante</Label>
                    <Input value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="Ej: 987654" className="h-10" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Inicio Período</Label>
                    <Input type="date" value={payPeriodStart} onChange={(e) => setPayPeriodStart(e.target.value)} required className="h-10" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Fin Período (Próx. Cobro)</Label>
                    <Input type="date" value={payPeriodEnd} onChange={(e) => setPayPeriodEnd(e.target.value)} required className="h-10" />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">Notas del Recibo</Label>
                  <Input value={payNotes} onChange={(e) => setPayNotes(e.target.value)} placeholder="Ej: Pago mensualidad Plan Emprendedor" className="h-10" />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <Button type="button" variant="outline" onClick={() => setPayingStore(null)}>Cancelar</Button>
                  <Button type="submit" disabled={savingPayment} className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
                    {savingPayment ? <Loader2 className="animate-spin" /> : 'Confirmar y Activar'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}


      {/* Modal: Contraseña Restablecida (F2G-03) */}
      {resetModalData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-white rounded-2xl shadow-2xl border-none">
            <CardHeader className="flex flex-row justify-between items-center border-b pb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-700">
                  <KeyRound size={20} />
                </div>
                <div>
                  <CardTitle className="text-lg font-black text-gray-900">Contraseña Restablecida</CardTitle>
                  <CardDescription className="text-xs text-gray-500">Nueva clave temporal para el comercio</CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setResetModalData(null)} className="h-8 w-8 p-0">
                <X size={18} />
              </Button>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-sm">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-xs">Comercio:</span>
                  <span className="font-bold text-gray-900">{resetModalData.store_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-xs">Usuario Admin:</span>
                  <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs">
                    @{resetModalData.admin_username}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-gray-200">
                  <span className="text-gray-500 text-xs">Nueva Contraseña:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-amber-900 bg-amber-100 px-2.5 py-1 rounded text-sm tracking-wider">
                      {resetModalData.temporary_password}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(resetModalData.temporary_password);
                        toast.success("Contraseña copiada al portapapeles");
                      }}
                      className="p-1 text-gray-500 hover:text-gray-800"
                      title="Copiar contraseña"
                    >
                      <Copy size={15} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setResetModalData(null)}
                  className="font-bold text-xs"
                >
                  Cerrar
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    const phone = resetModalData.admin_phone ? resetModalData.admin_phone.replace(/\D/g, '') : '';
                    const loginUrl = `${window.location.origin}/admin-login`;
                    const msg = encodeURIComponent(`Hola! Desde el equipo de TiendaFast hemos restablecido el acceso de tu tienda '${resetModalData.store_name}'.\n\n🔐 *Tus nuevas credenciales:*\n👤 Usuario: ${resetModalData.admin_username}\n🔑 Contraseña: ${resetModalData.temporary_password}\n\nIngresa en: ${loginUrl}\n(Recuerda cambiar tu contraseña en Configuración una vez dentro).`);
                    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
                  }}
                  className="font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                >
                  <MessageSquare size={14} /> Enviar por WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Modal: Recibo de Pago (F2B-08) */}
      {receiptStore && receiptStore.last_payment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-white rounded-2xl shadow-2xl border-none">
            <CardHeader className="flex flex-row justify-between items-center border-b pb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-emerald-500" size={24} />
                <div>
                  <CardTitle className="text-lg font-black">Comprobante de Suscripción</CardTitle>
                  <CardDescription className="text-xs">Recibo oficial de pago SaaS</CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setReceiptStore(null)} className="h-8 w-8 p-0">
                <X size={18} />
              </Button>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-sm">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Cliente:</span>
                  <span className="font-bold text-gray-900">{receiptStore.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Plan:</span>
                  <span className="font-bold text-blue-600">{receiptStore.plan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Monto Recibido:</span>
                  <span className="font-black text-emerald-600">${receiptStore.last_payment.amount} {receiptStore.last_payment.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Método:</span>
                  <span className="font-semibold text-gray-800">{receiptStore.last_payment.payment_method}</span>
                </div>
                {receiptStore.last_payment.payment_reference && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Referencia:</span>
                    <span className="font-mono text-gray-800">{receiptStore.last_payment.payment_reference}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Período Cubierto:</span>
                  <span className="font-semibold text-gray-800">
                    {new Date(receiptStore.last_payment.period_start).toLocaleDateString()} al {new Date(receiptStore.last_payment.period_end).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-400 pt-1 border-t">
                  <span>Fecha de Emisión:</span>
                  <span>{new Date(receiptStore.last_payment.created_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => window.print()} className="font-bold">
                  Imprimir Comprobante
                </Button>
                <Button onClick={() => setReceiptStore(null)} className="font-bold bg-primary text-white">
                  Cerrar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
