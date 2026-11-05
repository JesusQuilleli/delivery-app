import { toast } from 'sonner';

export interface OrderNotificationPayload {
  id: number;
  status: string;
  delivery_address?: string | null;
  estimated_minutes?: number | null;
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  AWAITING_PAYMENT: 'Pago por validar',
  PENDING: 'Pedido recibido',
  ACCEPTED: 'Preparando tu pedido',
  DISPATCHED: 'Tu pedido va en camino',
  DELIVERED: 'Pedido entregado',
  CANCELLED: 'Pedido cancelado',
};

export function getOrderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status] || 'Pedido actualizado';
}

let audioContext: AudioContext | null = null;

export function playOrderChime() {
  if (typeof window === 'undefined') return;

  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    audioContext = audioContext || new AudioCtx();
    const ctx = audioContext;
    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    [880, 1180].forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, now + index * 0.12);
      gain.gain.setValueAtTime(0.0001, now + index * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.12, now + index * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.12 + 0.18);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(now + index * 0.12);
      oscillator.stop(now + index * 0.12 + 0.2);
    });
  } catch {
    // Si el navegador bloquea el audio, la notificación visual sigue funcionando.
  }
}

export function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'default') {
    void Notification.requestPermission().catch(() => {});
  }
}

export function notifyOrderUpdate(order: OrderNotificationPayload) {
  const label = getOrderStatusLabel(order.status);
  const title = `Pedido #${order.id}: ${label}`;
  const destination = order.delivery_address?.split(' |')[0];
  const description = destination
    ? `${destination}${order.estimated_minutes ? ` · ~${order.estimated_minutes} min` : ''}`
    : order.estimated_minutes
      ? `Tiempo estimado: ~${order.estimated_minutes} min`
      : 'Abre Mis Pedidos para ver el detalle.';

  toast.info(title, { description, duration: 7000 });
  playOrderChime();

  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' && document.hidden) {
    try {
      const notification = new Notification(title, {
        body: description,
        icon: '/favicon.ico',
        tag: `order-${order.id}-${order.status}`,
      });
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch {
      // Si el sistema operativo bloquea la notificación nativa, queda el toast.
    }
  }
}
