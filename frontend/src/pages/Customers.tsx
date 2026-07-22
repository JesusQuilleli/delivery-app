import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import api from '../api';
import { Card, CardContent } from '../components/ui/card';
import { Users, Mail, Phone, Calendar, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

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

  useEffect(() => {
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
    fetchCustomers();
  }, [slug]);

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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
