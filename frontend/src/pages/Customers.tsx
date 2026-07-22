import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import api from '../api';
import { Card, CardContent } from '../components/ui/card';
import { Users, Mail, Phone, Calendar, ShoppingBag, Edit, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

interface Customer {
  id: number;
  name: string | null;
  email: string;
  phone: string | null;
  createdAt: string;
  total_orders: number;
}

export default function Customers() {
  const { slug } = useParams<{ slug: string }>();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/stores/${slug}/customers`);
      setCustomers(res.data);
    } catch (error) {
      console.error('Error fetching customers', error);
      toast.error('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [slug]);

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditName(customer.name || '');
    setEditEmail(customer.email || '');
    setEditPhone(customer.phone || '');
  };

  const handleSaveEdit = async () => {
    if (!selectedCustomer) return;
    try {
      setIsSaving(true);
      await api.put(`/stores/${slug}/customers/${selectedCustomer.id}`, {
        name: editName,
        email: editEmail,
        phone: editPhone,
      });
      toast.success('Cliente actualizado con éxito');
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (error) {
      console.error(error);
      toast.error('Error al actualizar el cliente');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.')) return;
    try {
      await api.delete(`/stores/${slug}/customers/${id}`);
      toast.success('Cliente eliminado con éxito');
      fetchCustomers();
    } catch (error: any) {
      console.error(error);
      if (error.response && error.response.data && error.response.data.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Error al eliminar el cliente');
      }
    }
  };

  return (
    <AdminLayout title="Clientes Registrados">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total Clientes</p>
                <p className="text-3xl font-black text-foreground">{customers.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border shadow-sm bg-card rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground font-bold">Cargando clientes...</div>
          ) : customers.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground font-bold flex flex-col items-center">
              <Users size={48} className="mb-4 opacity-20" />
              <p>Aún no hay clientes registrados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="p-4 text-xs font-black uppercase text-muted-foreground tracking-wider">Cliente</th>
                    <th className="p-4 text-xs font-black uppercase text-muted-foreground tracking-wider">Contacto</th>
                    <th className="p-4 text-xs font-black uppercase text-muted-foreground tracking-wider">Registro</th>
                    <th className="p-4 text-xs font-black uppercase text-muted-foreground tracking-wider text-center">Pedidos</th>
                    <th className="p-4 text-xs font-black uppercase text-muted-foreground tracking-wider text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-foreground text-base">{c.name || 'Sin Nombre'}</div>
                      </td>
                      <td className="p-4 space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <Mail size={14} className="text-muted-foreground" />
                          <a href={`mailto:${c.email}`} className="hover:text-primary transition-colors">{c.email}</a>
                        </div>
                        {c.phone && (
                          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <Phone size={14} className="text-muted-foreground" />
                            <a href={`tel:${c.phone}`} className="hover:text-primary transition-colors">{c.phone}</a>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Calendar size={14} />
                        {format(new Date(c.createdAt), "dd MMM yyyy", { locale: es })}
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 bg-primary/10 text-primary font-black rounded-lg text-sm">
                          <ShoppingBag size={14} />
                          {c.total_orders}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(c)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar cliente"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar cliente"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Modal de Edición */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md animate-in zoom-in-95 duration-200 shadow-2xl border-0 relative">
            <button 
              onClick={() => setSelectedCustomer(null)}
              className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
            >
              <X size={18} />
            </button>
            <CardContent className="p-6">
              <h3 className="text-2xl font-black text-gray-900 mb-6 font-display">Editar Cliente</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Nombre Completo</label>
                  <Input 
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="h-12 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Correo Electrónico</label>
                  <Input 
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    placeholder="Ej. juan@correo.com"
                    className="h-12 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Teléfono (con código)</label>
                  <Input 
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    placeholder="Ej. +584120000000"
                    className="h-12 bg-gray-50"
                  />
                </div>
              </div>
              <div className="mt-8 flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedCustomer(null)} 
                  className="flex-1 h-12 font-bold"
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSaveEdit} 
                  className="flex-1 h-12 font-black shadow-lg shadow-primary/20"
                  disabled={isSaving}
                >
                  {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
}
