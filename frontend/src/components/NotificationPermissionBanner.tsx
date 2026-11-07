import { useState, useEffect } from 'react';
import { Bell, BellRing, Volume2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { playOrderChime, showNativeNotification } from '@/lib/notifications';

interface NotificationPermissionBannerProps {
  role?: 'admin' | 'customer';
  className?: string;
}

export function NotificationPermissionBanner({ role = 'admin', className = '' }: NotificationPermissionBannerProps) {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('granted');
  const [dismissed, setDismissed] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission);
  }, []);

  if (permission === 'granted' || permission === 'unsupported' || dismissed) {
    return null;
  }

  const handleRequest = async () => {
    try {
      setRequesting(true);
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm === 'granted') {
        playOrderChime(role === 'admin');
        if (role === 'admin') {
          await showNativeNotification('🚨 ¡Alertas de TiendaFast Activadas!', {
            body: 'Recibirás avisos sonoros de cada nuevo pedido en tiempo real en este dispositivo.',
            tag: 'tiendafast-admin-welcome'
          } as any);
          toast.success('¡Alertas sonoras y notificaciones push activadas correctamente!');
        } else {
          await showNativeNotification('🛵 ¡Avisos de Pedido Activados!', {
            body: 'Te notificaremos al instante cuando tu pedido sea despachado y vaya en camino.',
            tag: 'tiendafast-customer-welcome'
          } as any);
          toast.success('¡Notificaciones de entrega activadas en tu teléfono!');
        }
      } else if (perm === 'denied') {
        toast.info('Notificaciones no permitidas. Puedes activarlas luego desde el icono del candado en tu navegador.');
      }
    } catch (err) {
      console.error('Error solicitando permisos de notificación:', err);
    } finally {
      setRequesting(false);
    }
  };

  if (permission === 'denied') {
    return (
      <div className={`p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-center justify-between gap-3 shadow-xs ${className}`}>
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-amber-600 shrink-0" />
          <span>
            Las notificaciones están bloqueadas en este dispositivo. Para recibir alertas de pedidos con sonido, habilítalas en los permisos del navegador (icono del candado 🔒).
          </span>
        </div>
        <button onClick={() => setDismissed(true)} className="text-amber-500 hover:text-amber-800 p-1 shrink-0">
          <X size={16} />
        </button>
      </div>
    );
  }

  // permission === 'default'
  if (role === 'admin') {
    return (
      <div className={`relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700 text-white p-4 sm:p-4.5 rounded-2xl shadow-lg shadow-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${className}`}>
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl shrink-0 mt-0.5">
            <BellRing size={22} className="animate-bounce text-yellow-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-black text-sm sm:text-base tracking-tight">Activar Alertas de Pedidos con Sonido</h4>
              <span className="bg-yellow-400 text-gray-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                Recomendado
              </span>
            </div>
            <p className="text-xs text-white/90 font-medium mt-1 leading-relaxed max-w-xl">
              Recibe avisos inmediatos en tu teléfono móvil o computadora cada vez que llegue un nuevo pedido, con sonido y vibración aunque estés en otra app o con la pantalla bloqueada.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 pt-2 sm:pt-0">
          <button
            onClick={() => setDismissed(true)}
            className="text-white/70 hover:text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
          >
            Ahora no
          </button>
          <Button
            onClick={handleRequest}
            disabled={requesting}
            className="bg-white hover:bg-yellow-300 text-indigo-900 font-black text-xs sm:text-sm h-10 px-4 rounded-xl shadow-md transition-all hover:scale-105 active:scale-95"
          >
            <Volume2 size={16} className="mr-1.5 text-indigo-700" /> Activar Alertas 🔔
          </Button>
        </div>
      </div>
    );
  }

  // role === 'customer'
  return (
    <div className={`p-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl shadow-md shadow-emerald-600/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in ${className}`}>
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-white/20 rounded-xl shrink-0">
          <Bell size={20} className="animate-pulse text-yellow-200" />
        </div>
        <div>
          <h4 className="font-black text-sm">¿Deseas saber cuándo tu pedido vaya en camino?</h4>
          <p className="text-xs text-emerald-100 font-medium mt-0.5">
            Activa las notificaciones en tu teléfono para avisarte en tiempo real cuando tu orden sea despachada y entregada.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        <button
          onClick={() => setDismissed(true)}
          className="text-white/70 hover:text-white text-xs font-bold px-2 py-1.5"
        >
          Omitir
        </button>
        <Button
          onClick={handleRequest}
          disabled={requesting}
          className="bg-white hover:bg-emerald-50 text-emerald-800 font-black text-xs h-9 px-3.5 rounded-xl shadow-xs"
        >
          Activar Notificaciones 🛵
        </Button>
      </div>
    </div>
  );
}
