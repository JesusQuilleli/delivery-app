import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function LoadingOverlay({ isLoading, text = 'Cargando...' }: { isLoading: boolean, text?: string }) {
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      setSecondsElapsed(0);
      interval = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center animate-in fade-in duration-300">
      <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-3 animate-in zoom-in-95 max-w-xs text-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <span className="text-gray-900 font-black text-lg tracking-wide mt-2">{text}</span>
        
        <p className="text-xs text-gray-500 font-medium min-h-[20px] transition-all duration-500">
          {secondsElapsed > 10 ? (
            "El servidor está procesando, gracias por esperar..."
          ) : secondsElapsed > 3 ? (
            "Esto puede tomar unos segundos..."
          ) : (
            ""
          )}
        </p>
      </div>
    </div>
  );
}
