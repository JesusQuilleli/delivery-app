import { useState, useEffect } from 'react';
import { Bell, BellRing, Volume2, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { playOrderChime, showNativeNotification } from '@/lib/notifications';

interface NotificationPermissionBannerProps {
  role?: 'admin' | 'customer';
  className?: string;
  showSuccessState?: boolean;
}

export function NotificationPermissionBanner({ 
  role = 'admin', 
  className = '',
  showSuccessState = false 
}: NotificationPermissionBannerProps) {
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

  if (permission === 'unsupported' || dismissed) {
    return null;
  }

  const handleRequest = async () => {
    try {
      setRequesting(true);
      if (!('Notification' in window)) {
        toast.error('Este navegador no soporta notificaciones push.');
        return;
      }

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
        toast.error('Notificaciones bloqueadas por el navegador.');
      }
    } catch (err) {
      console.error('Error solicitando permisos de notificación:', err);
    } finally {
      setRequesting(false);
    }
  };

  const handleTestChime = () => {
    playOrderChime(role === 'admin');
    toast.success('🔔 Sonido de prueba reproducido correctamente');
  };

  // If already granted and showSuccessState is requested
  if (permission === 'granted') {
    if (!showSuccessState) return null;
    return (
      <div className={`p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs flex items-center justify-between gap-3 shadow-xs ${className}`}>
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span className="font-semibold">
            {role === 'admin' 
              ? 'Alertas de pedidos y avisos sonoros activados en este dispositivo.' 
              : 'Notificaciones activadas. Te avisaremos cuando tu orden sea despachada.'}
          </span>
        </div>
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          onClick={handleTestChime} 
          className="h-7 text-xs text-emerald-700 hover:bg-emerald-100 font-bold"
        >
          <Volume2 size={13} className="mr-1" /> Probar Sonido
        </Button>
      </div>
    );
  }

  // If denied, show clear step-by-step guidance
  if (permission === 'denied') {
    return (
      <div className={`p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-950 text-xs shadow-sm ${className}`}>
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 rounded-xl shrink-0 text-amber-700 mt-0.5">
            <AlertTriangle size={18} />
          </div>
          <div className="flex-1 space-y-1.5">
            <h5 className="font-black text-amber-900 text-sm">
              {role === 'admin' ? '🔔 Notificaciones bloqueadas en tu navegador' : '🛵 Notificaciones bloqueadas para tus pedidos'}
            </h5>
            <p className="text-amber-800 leading-relaxed font-medium">
              Para que la app web pueda avisarte {role === 'admin' ? 'de nuevos pedidos con sonido' : 'cuando tu pedido esté en camino'}, habilítalas en 3 pasos:
            </p>
            <ol className="list-decimal list-inside space-y-0.5 font-medium text-amber-900/90 pl-1">
              <li>Toca el icono del candado o ajustes 🔒 a la izquierda del enlace web.</li>
              <li>Selecciona <b>Permisos</b> o <b>Configuración del sitio</b>.</li>
              <li>Cambia <b>Notificaciones</b> de "Bloquear" a <b>"Permitir"</b> y recarga la página.</li>
            </ol>
          </div>
          <button 
            type="button" 
            onClick={() => setDismissed(true)} 
            className="text-amber-500 hover:text-amber-800 p-1 shrink-0 rounded-lg hover:bg-amber-100/50"
            title="Cerrar aviso"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  // permission === 'default'
  if (role === 'admin') {
    return (
      <div className={`relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700 text-white p-4 sm:p-5 rounded-2xl shadow-lg shadow-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300 ${className}`}>
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl shrink-0 mt-0.5">
            <BellRing size={24} className="animate-bounce text-yellow-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-black text-sm sm:text-base tracking-tight">
                🔔 ¡Activa las Notificaciones Push del Administrador!
              </h4>
              <span className="bg-yellow-400 text-gray-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                Recomendado
              </span>
            </div>
            <p className="text-xs sm:text-[13px] text-white/95 font-medium mt-1 leading-relaxed max-w-2xl">
              Para que la app web pueda avisarte con <b>sonido de timbre y vibración inmediata</b> cada vez que un cliente realice un nuevo pedido, incluso si tienes la pantalla bloqueada, el teléfono en el bolsillo o estás en otra aplicación.
            </p>
            <div className="flex items-center gap-3 mt-2 text-[11px] text-indigo-100 font-bold flex-wrap">
              <span className="inline-flex items-center gap-1">✓ Sonido en vivo</span>
              <span className="inline-flex items-center gap-1">✓ Avisos en segundo plano</span>
              <span className="inline-flex items-center gap-1">✓ Vibración en teléfono</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0 pt-2 sm:pt-0">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-white/75 hover:text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
          >
            Ahora no
          </button>
          <Button
            type="button"
            onClick={handleRequest}
            disabled={requesting}
            className="bg-white hover:bg-yellow-300 text-indigo-950 font-black text-xs sm:text-sm h-11 px-5 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
          >
            <Volume2 size={16} className="mr-1.5 text-indigo-700" /> Activar Alertas 🔔
          </Button>
        </div>
      </div>
    );
  }

  // role === 'customer'
  return (
    <div className={`p-4 sm:p-4.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-2xl shadow-md shadow-emerald-600/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in ${className}`}>
      <div className="flex items-start sm:items-center gap-3">
        <div className="p-2.5 bg-white/20 rounded-xl shrink-0 mt-0.5 sm:mt-0">
          <Bell size={22} className="animate-pulse text-yellow-200" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-black text-sm sm:text-base">🛵 ¡Activa las Notificaciones de tu Pedido!</h4>
            <span className="bg-emerald-400/30 text-emerald-100 font-bold text-[10px] px-2 py-0.5 rounded-full border border-emerald-300/30">
              En Tiempo Real
            </span>
          </div>
          <p className="text-xs text-emerald-100 font-medium mt-0.5 leading-relaxed">
            Para que la app web pueda avisarte al instante cuando tu orden sea aceptada, esté <b>en camino con el repartidor</b> o haya llegado a tu puerta, sin necesidad de mantener esta pantalla abierta.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 pt-1 sm:pt-0">
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-white/70 hover:text-white text-xs font-bold px-2.5 py-1.5 rounded-lg"
        >
          Omitir
        </button>
        <Button
          type="button"
          onClick={handleRequest}
          disabled={requesting}
          className="bg-white hover:bg-emerald-50 text-emerald-900 font-black text-xs sm:text-sm h-10 px-4 rounded-xl shadow-md transition-all hover:scale-105 active:scale-95"
        >
          Activar Notificaciones 🛵
        </Button>
      </div>
    </div>
  );
}

/**
 * Botón interactivo compacto para el header administrativo que muestra el estado de las alertas
 */
export function NotificationStatusButton() {
  const [perm, setPerm] = useState<NotificationPermission | 'unsupported'>('granted');

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPerm('unsupported');
      return;
    }
    setPerm(Notification.permission);
  }, []);

  if (perm === 'unsupported') return null;

  const handleClick = async () => {
    if (perm === 'granted') {
      playOrderChime(true);
      toast.success('🔔 Alertas sonoras activas y funcionando correctamente en este dispositivo.');
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPerm(result);
      if (result === 'granted') {
        playOrderChime(true);
        await showNativeNotification('🚨 ¡Alertas Activadas!', {
          body: 'Notificaciones y sonido configurados correctamente.',
        } as any);
        toast.success('¡Alertas sonoras y notificaciones push activadas!');
      } else if (result === 'denied') {
        toast.error('Notificaciones bloqueadas en el navegador. Habilítalas desde el icono del candado 🔒');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (perm === 'granted') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 font-bold text-xs transition-colors shadow-xs"
        title="Alertas con sonido activas (Clic para probar timbre)"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <Volume2 size={14} className="text-emerald-600" />
        <span className="hidden md:inline">Alertas Activas</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs transition-all shadow-md animate-pulse"
      title="Clic para activar alertas y sonido de nuevos pedidos"
    >
      <BellRing size={14} className="animate-bounce" />
      <span>Activar Alertas 🔔</span>
    </button>
  );
}
