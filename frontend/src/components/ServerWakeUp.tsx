import React, { useState, useEffect } from 'react';
import { Loader2, ServerCog } from 'lucide-react';
import api from '../api';

export default function ServerWakeUp({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'checking' | 'waking_up' | 'awake'>('checking');
  
  useEffect(() => {
    let isMounted = true;
    let timer: ReturnType<typeof setTimeout>;

    const pingServer = async () => {
      try {
        // Hacemos una petición rápida al endpoint de inicio
        await api.get('/'); 
        if (isMounted) setStatus('awake');
      } catch (error: any) {
        // Si hay un error, pero es un error con respuesta de Express (ej. 404, 500 no proxy), el server está despierto
        if (error.response && error.response.status !== 503 && error.response.status !== 502) {
          if (isMounted) setStatus('awake');
        } else {
          // Si es Network Error (no response) o 503/502 de Render, está dormido
          if (isMounted) {
            setStatus('waking_up');
            // Reintentar en 3 segundos
            timer = setTimeout(pingServer, 3000);
          }
        }
      }
    };

    // Si tarda más de 800ms en responder la primera vez, mostramos la pantalla de carga
    const slowLoadingTimer = setTimeout(() => {
      if (isMounted && status === 'checking') {
        setStatus('waking_up');
      }
    }, 800);

    pingServer();

    return () => {
      isMounted = false;
      clearTimeout(timer);
      clearTimeout(slowLoadingTimer);
    };
  }, []);

  if (status === 'checking') {
    // Pantalla en blanco (o loader invisible) durante los primeros 800ms
    // para evitar "flickering" si el servidor ya está despierto
    return null;
  }

  if (status === 'waking_up') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 text-zinc-100 p-6 text-center">
        <div className="bg-zinc-900/80 p-8 rounded-2xl border border-zinc-800 shadow-2xl backdrop-blur-xl max-w-md w-full">
          <div className="flex justify-center mb-8 relative">
            <div className="relative">
              <ServerCog className="w-16 h-16 text-emerald-500 animate-pulse" />
              <div className="absolute -bottom-2 -right-2 bg-zinc-900 rounded-full p-1">
                <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
              </div>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold mb-3 text-white">Despertando servidor</h2>
          
          <p className="text-zinc-400 mb-6 text-sm leading-relaxed">
            Nuestra aplicación está alojada en un servicio que entra en estado de reposo.
            Se está iniciando, esto puede tardar alrededor de <span className="font-medium text-zinc-200">30 a 50 segundos</span>.
          </p>
          
          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full w-full animate-[pulse_2s_ease-in-out_infinite]"></div>
          </div>
          
          <p className="text-xs text-zinc-500 mt-5">
            Por favor, no cierres esta ventana...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
