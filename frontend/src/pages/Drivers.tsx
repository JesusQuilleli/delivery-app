import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import api from '../api';
import { Card, CardContent } from '../components/ui/card';
import { Bike, Phone, Edit, Trash2, X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

interface Driver {
  id: number;
  name: string;
  phone: string;
  vehicle_plate: string | null;
  is_active: boolean;
}

export default function Drivers() {
  const { slug } = useParams<{ slug: string }>();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/stores/${slug}/drivers`);
      setDrivers(res.data.drivers);
    } catch (error) {
      console.error('Error fetching drivers', error);
      toast.error('Error al cargar motorizados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [slug]);

  const openNewModal = () => {
    setEditingDriver(null);
    setName('');
    setPhone('');
    setVehiclePlate('');
    setShowModal(true);
  };

  const openEditModal = (d: Driver) => {
    setEditingDriver(d);
    setName(d.name);
    setPhone(d.phone);
    setVehiclePlate(d.vehicle_plate || '');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name || !phone) {
      toast.error('Nombre y teléfono son requeridos');
      return;
    }
    try {
      setIsSaving(true);
      if (editingDriver) {
        await api.put(`/stores/${slug}/drivers/${editingDriver.id}`, {
          name, phone, vehicle_plate: vehiclePlate, is_active: editingDriver.is_active
        });
        toast.success('Motorizado actualizado');
      } else {
        await api.post(`/stores/${slug}/drivers`, {
          name, phone, vehicle_plate: vehiclePlate
        });
        toast.success('Motorizado registrado');
      }
      setShowModal(false);
      fetchDrivers();
    } catch (error) {
      console.error(error);
      toast.error('Error al guardar motorizado');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este motorizado?')) return;
    try {
      await api.delete(`/stores/${slug}/drivers/${id}`);
      toast.success('Motorizado eliminado');
      fetchDrivers();
    } catch (error: any) {
      console.error(error);
      toast.error('Error al eliminar (quizás tiene pedidos asignados)');
    }
  };

  return (
    <AdminLayout title="Flota y Motorizados">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="flex justify-between items-center">
          <Card className="bg-card border-border shadow-sm flex-1 max-w-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <Bike size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Flota Activa</p>
                <p className="text-3xl font-black text-foreground">{drivers.length}</p>
              </div>
            </CardContent>
          </Card>

          <Button onClick={openNewModal} className="h-12 px-6 font-black shadow-lg shadow-primary/20 flex items-center gap-2">
            <Plus size={20} /> Registrar Motorizado
          </Button>
        </div>

        <Card className="border-border shadow-sm bg-card rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground font-bold">Cargando motorizados...</div>
          ) : drivers.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground font-bold flex flex-col items-center">
              <Bike size={48} className="mb-4 opacity-20" />
              <p>No tienes motorizados registrados en tu flota.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="p-4 text-xs font-black uppercase text-muted-foreground tracking-wider">Nombre</th>
                    <th className="p-4 text-xs font-black uppercase text-muted-foreground tracking-wider">Teléfono</th>
                    <th className="p-4 text-xs font-black uppercase text-muted-foreground tracking-wider">Placa / Vehículo</th>
                    <th className="p-4 text-xs font-black uppercase text-muted-foreground tracking-wider text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {drivers.map((d) => (
                    <tr key={d.id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-foreground text-base flex items-center gap-2">
                          <Bike size={16} className="text-primary" /> {d.name}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <Phone size={14} className="text-muted-foreground" />
                          <a href={`tel:${d.phone}`} className="hover:text-primary transition-colors">{d.phone}</a>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-medium text-muted-foreground">
                        {d.vehicle_plate || 'No especificada'}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(d)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar motorizado"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(d.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar motorizado"
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md animate-in zoom-in-95 duration-200 shadow-2xl border-0 relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
            >
              <X size={18} />
            </button>
            <CardContent className="p-6">
              <h3 className="text-2xl font-black text-gray-900 mb-6 font-display">
                {editingDriver ? 'Editar Motorizado' : 'Nuevo Motorizado'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Nombre Completo</label>
                  <Input 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ej. Carlos Mendoza"
                    className="h-12 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Teléfono (con código)</label>
                  <Input 
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="Ej. +584120000000"
                    className="h-12 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Placa del Vehículo (Opcional)</label>
                  <Input 
                    value={vehiclePlate}
                    onChange={e => setVehiclePlate(e.target.value)}
                    placeholder="Ej. ABC-123"
                    className="h-12 bg-gray-50"
                  />
                </div>
              </div>
              <div className="mt-8 flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 h-12 font-bold"
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSave} 
                  className="flex-1 h-12 font-black shadow-lg shadow-primary/20"
                  disabled={isSaving}
                >
                  {isSaving ? 'Guardando...' : 'Guardar Motorizado'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
}
