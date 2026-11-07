import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Lock, User, Eye, EyeOff, MessageSquare, KeyRound, HelpCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { toast } from 'sonner';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { from?: string })?.from || sessionStorage.getItem('admin_return_to');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/admin-login', { username, password });
      login(res.data.user);
      sessionStorage.removeItem('admin_return_to');

      if (returnTo && (returnTo.startsWith('/admin/') || returnTo === '/superadmin')) {
        navigate(returnTo, { replace: true });
      } else if (res.data.user.role === 'SUPERADMIN') {
        navigate('/superadmin', { replace: true });
      } else if (res.data.user.store?.slug) {
        navigate(`/admin/${res.data.user.store.slug}`, { replace: true });
      } else {
        navigate('/superadmin', { replace: true });
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Error al iniciar sesión");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-none bg-white/80 backdrop-blur-xl">
        <CardHeader className="space-y-1 text-center pb-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Lock className="text-gray-900" size={32} />
          </div>
          <CardTitle className="text-3xl font-black text-gray-900 tracking-tight">Acceso Admin</CardTitle>
          <CardDescription className="text-gray-500 font-medium">
            Ingresa tus credenciales para gestionar pedidos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2 relative">
              <User className="absolute left-3 top-3 text-gray-400" size={20} />
              <Input 
                placeholder="Nombre de Usuario" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="pl-10 h-12 bg-gray-50/50 border-gray-200 focus:bg-white transition-all shadow-sm"
                required
              />
            </div>
            <div className="space-y-2 relative">
              <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <Input 
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="pl-10 pr-10 h-12 bg-gray-50/50 border-gray-200 focus:bg-white transition-all shadow-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-700 transition"
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                onClick={() => {
                  setForgotInput(username);
                  setIsForgotOpen(true);
                }}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition flex items-center gap-1 hover:underline"
              >
                <HelpCircle size={13} /> ¿Olvidaste tu contraseña?
              </button>
            </div>
            <Button type="submit" className="w-full h-12 mt-6 text-lg font-bold shadow-md hover:shadow-lg transition-all" disabled={loading}>
              {loading ? 'Verificando...' : 'Entrar al Panel'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Modal de Solicitud de Desbloqueo / Recuperación con SuperAdmin */}
      <Dialog open={isForgotOpen} onOpenChange={setIsForgotOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-white p-6">
          <DialogHeader className="text-center space-y-2">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-700">
              <KeyRound size={24} />
            </div>
            <DialogTitle className="text-xl font-black text-gray-900">
              Recuperar Acceso Administrativo
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Por políticas de seguridad, las contraseñas de las tiendas son restablecidas directamente por el SuperAdministrador de TiendaFast.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase">
                Nombre de Usuario o Negocio
              </label>
              <Input
                placeholder="Ej. admin_comida o Mi Hamburguesería"
                value={forgotInput}
                onChange={e => setForgotInput(e.target.value)}
                className="h-10 text-xs bg-gray-50"
              />
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600 space-y-1">
              <p className="font-bold text-gray-800">¿Cómo funciona?</p>
              <p>Al pulsar el botón a continuación, se abrirá un chat directo de WhatsApp con el SuperAdmin solicitando un código temporal de desbloqueo.</p>
            </div>

            <Button
              type="button"
              onClick={() => {
                const storeName = forgotInput.trim() || 'mi negocio';
                const msg = encodeURIComponent(`Hola SuperAdmin, soy el encargado de la tienda '${storeName}' y olvidé mi contraseña de acceso al panel de TiendaFast. Por favor apóyame con el restablecimiento de mi cuenta.`);
                window.open(`https://wa.me/584124742535?text=${msg}`, '_blank');
                setIsForgotOpen(false);
              }}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md gap-2"
            >
              <MessageSquare size={16} /> Solicitar Desbloqueo por WhatsApp al SuperAdmin
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
