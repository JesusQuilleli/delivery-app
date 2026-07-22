import { Loader2 } from 'lucide-react';

export default function LoadingOverlay({ isLoading, text = 'Cargando...' }: { isLoading: boolean, text?: string }) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center animate-in fade-in duration-300">
      <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-95">
        <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
        <span className="text-gray-700 font-bold tracking-wide">{text}</span>
      </div>
    </div>
  );
}
