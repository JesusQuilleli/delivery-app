import { useEffect, useState } from 'react';
import api from '../api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Store, Plus, ShieldAlert, Power, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function SuperAdmin() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Create form state
  const [storeName, setStoreName] = useState('');
  const [slug, setSlug] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [industry, setIndustry] = useState('PHARMACY');
  const [themeColor, setThemeColor] = useState('blue');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const res = await api.get('/superadmin/stores');
      setStores(res.data);
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

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/superadmin/stores', {
        storeName,
        slug,
        adminUsername,
        adminPhone,
        adminPassword,
        industry,
        theme_color: themeColor
      });
      toast.success('Tienda creada exitosamente.');
      setStoreName(''); setSlug(''); setAdminUsername(''); setAdminPhone(''); setAdminPassword(''); setIndustry('PHARMACY'); setThemeColor('blue');
      fetchStores();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al crear la tienda.');
      console.error(error);
    } finally {
      setCreating(false);
    }
  };

  const toggleStatus = async (id: number) => {
    if (!window.confirm('¿Cambiar el estado de esta tienda? Si la desactivas, no podrán recibir pedidos.')) return;
    try {
      await api.put(`/superadmin/stores/${id}/status`);
      fetchStores();
    } catch (e) {
      console.error(e);
      toast.error('Error al cambiar el estado.');
    }
  };

  // Helper to auto-generate slug
  const generateSlug = (name: string) => {
    setStoreName(name);
    setSlug(name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, ''));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex items-center gap-3 mb-8">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
            <ShieldAlert size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900">Panel SuperAdmin (SaaS)</h1>
            <p className="text-gray-500 font-medium">Gestiona todas las tiendas e inquilinos (Tenants) de la plataforma.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create New Store Form */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg border-0 rounded-2xl sticky top-8">
              <CardHeader className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-t-2xl">
                <CardTitle className="flex items-center gap-2"><Plus /> Nueva Tienda</CardTitle>
                <CardDescription className="text-gray-300">Da de alta a un nuevo cliente en la plataforma.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleCreateStore} className="space-y-4">
                  
                  <div className="space-y-2">
                    <Label className="font-bold text-gray-700">Nombre del Negocio</Label>
                    <Input required value={storeName} onChange={(e) => generateSlug(e.target.value)} placeholder="Ej: Farmacia Los Andes" className="h-12 bg-gray-50" />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-gray-700">URL / Slug</Label>
                    <Input required value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="farmacia-los-andes" className="h-12 bg-gray-50" />
                    <p className="text-xs text-gray-400">tiendafast.com/{slug}</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-gray-700">Tipo de Negocio</Label>
                    <select 
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full h-12 rounded-md border border-input bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="PHARMACY">Farmacia</option>
                      <option value="RESTAURANT">Restaurante / Comida</option>
                      <option value="SUPERMARKET">Supermercado / Bodegón</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-gray-700">Color Principal (Tema)</Label>
                    <div className="flex gap-3 mt-2">
                      {[
                        { id: 'blue', label: 'Azul (Original)', hex: '#2563eb' },
                        { id: 'red', label: 'Rojo', hex: '#dc2626' },
                        { id: 'green', label: 'Verde', hex: '#16a34a' },
                        { id: 'purple', label: 'Morado', hex: '#9333ea' },
                        { id: 'orange', label: 'Naranja', hex: '#ea580c' },
                        { id: 'coral', label: 'Coral', hex: '#f43f5e' }
                      ].map(color => (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => setThemeColor(color.id)}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${themeColor === color.id ? 'border-gray-900 scale-110 shadow-md' : 'border-transparent opacity-80 hover:opacity-100'}`}
                          style={{ backgroundColor: color.hex }}
                          title={color.label}
                        />
                      ))}
                    </div>
                  </div>

                  <hr className="my-4" />
                  <h4 className="font-black text-sm text-gray-500 uppercase">Cuenta del Administrador</h4>

                  <div className="space-y-2">
                    <Label className="font-bold text-gray-700">Usuario de Ingreso</Label>
                    <Input required value={adminUsername} onChange={(e) => setAdminUsername(e.target.value)} placeholder="admin_losandes" className="h-12 bg-gray-50" />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-gray-700">Teléfono (WhatsApp)</Label>
                    <Input required value={adminPhone} onChange={(e) => setAdminPhone(e.target.value)} placeholder="+584141234567" className="h-12 bg-gray-50" />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-gray-700">Contraseña</Label>
                    <Input required type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="h-12 bg-gray-50" />
                  </div>

                  <Button type="submit" disabled={creating} className="w-full h-12 text-lg font-black bg-blue-600 hover:bg-blue-700 rounded-xl mt-4">
                    {creating ? <Loader2 className="animate-spin" /> : 'Registrar Tienda'}
                  </Button>

                </form>
              </CardContent>
            </Card>
          </div>

          {/* List of Stores */}
          <div className="lg:col-span-2">
             <Card className="shadow-lg border-0 rounded-2xl h-full">
              <CardHeader className="bg-white border-b border-gray-100 rounded-t-2xl">
                <CardTitle className="flex items-center gap-2 text-xl"><Store className="text-blue-600" /> Tiendas Activas</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50/50">
                      <TableRow>
                        <TableHead className="font-black text-gray-900 pl-6">Negocio</TableHead>
                        <TableHead className="font-black text-gray-900">Administrador</TableHead>
                        <TableHead className="font-black text-gray-900">Stats</TableHead>
                        <TableHead className="font-black text-gray-900">Estado</TableHead>
                        <TableHead className="font-black text-gray-900 text-right pr-6">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-10 font-bold text-gray-400">Cargando tiendas...</TableCell></TableRow>
                      ) : stores.map(store => (
                        <TableRow key={store.id} className="hover:bg-gray-50/50">
                          <TableCell className="pl-6">
                            <p className="font-black text-lg">{store.name}</p>
                            <a href={`/${store.slug}`} target="_blank" className="text-sm text-blue-500 hover:underline">/{store.slug}</a>
                          </TableCell>
                          <TableCell>
                            {store.users && store.users[0] ? (
                              <div>
                                <p className="font-bold text-gray-800">@{store.users[0].username}</p>
                                <p className="text-xs text-gray-500 font-medium">{store.users[0].phone}</p>
                              </div>
                            ) : (
                              <span className="text-red-500 text-xs font-bold">Sin Admin</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="bg-orange-50 text-orange-700">{store._count?.orders || 0} pdos</Badge>
                              <Badge variant="outline" className="bg-purple-50 text-purple-700">{store._count?.products || 0} prods</Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={store.is_active ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}>
                              {store.is_active ? 'ACTIVA' : 'INACTIVA'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <Button 
                              variant={store.is_active ? "destructive" : "default"} 
                              size="sm" 
                              onClick={() => toggleStatus(store.id)}
                              className="rounded-lg shadow-sm font-bold"
                            >
                              <Power size={14} className="mr-1" />
                              {store.is_active ? 'Pausar' : 'Activar'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
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
    </div>
  );
}
