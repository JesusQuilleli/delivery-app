import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatusProps {
  connected: boolean;
}

export default function ConnectionStatus({ connected }: ConnectionStatusProps) {
  if (connected) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-xl shadow-lg animate-pulse">
      <WifiOff size={16} />
      <span className="text-sm font-bold">Reconectando...</span>
    </div>
  );
}
