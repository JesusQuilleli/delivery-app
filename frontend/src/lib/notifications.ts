import { toast } from 'sonner';

export interface OrderNotificationPayload {
  id: number;
  status: string;
  delivery_address?: string | null;
  estimated_minutes?: number | null;
  total_amount?: number;
  user?: { name?: string | null; phone?: string | null };
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

export function playOrderChime(urgent = false) {
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
    const frequencies = urgent ? [980, 1320, 1760] : [880, 1180];
    const duration = urgent ? 0.25 : 0.18;

    frequencies.forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, now + index * 0.12);
      gain.gain.setValueAtTime(0.0001, now + index * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.15, now + index * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.12 + duration);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(now + index * 0.12);
      oscillator.stop(now + index * 0.12 + duration + 0.05);
    });
  } catch {
    // Si el navegador bloquea el audio, la notificación visual continúa
  }
}

export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return Promise.resolve('denied' as NotificationPermission);
  }
  return Notification.requestPermission();
}

/**
 * Despacha notificación nativa en segundo plano (vía Service Worker o Notification API estándar).
 */
export async function showNativeNotification(title: string, options: NotificationOptions & { data?: { url?: string } } = {}) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const defaultOptions: NotificationOptions = {
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    ...options
  };

  // 1. Intentar por Service Worker (requerido para móvil Android en segundo plano)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        return reg.showNotification(title, defaultOptions);
      }
    } catch (e) {
      console.warn('SW showNotification fallback:', e);
    }
  }

  // 2. Fallback estándar a Notification de ventana
  try {
    const notification = new Notification(title, defaultOptions);
    notification.onclick = () => {
      window.focus();
      notification.close();
      if (options.data?.url) {
        window.location.href = options.data.url;
      }
    };
  } catch {
    // Manejo silencioso si el SO deniega
  }
}

/**
 * Notificación al CLIENTE cuando cambia el estado de su orden.
 */
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
  playOrderChime(order.status === 'DISPATCHED');

  // Si la pestaña está en segundo plano o el usuario está en otra app:
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' && document.hidden) {
    showNativeNotification(title, {
      body: description,
      tag: `order-${order.id}-${order.status}`,
      data: { url: '/mis-pedidos' }
    });
  }
}

/**
 * Notificación al ADMINISTRADOR cuando ingresa un nuevo pedido.
 */
export function notifyAdminNewOrder(order: OrderNotificationPayload, currency = 'USD', slug = '') {
  const title = `🚨 ¡Nuevo Pedido Recibido! #${order.id}`;
  const amountStr = order.total_amount != null ? `$${Number(order.total_amount).toFixed(2)} ${currency}` : '';
  const customerName = order.user?.name || 'Cliente';
  const body = `${customerName} · ${amountStr} — ${order.delivery_address?.split(' |')[0] || 'Para entrega'}`;

  toast.success(title, { description: body, duration: 9000 });
  playOrderChime(true);

  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' && document.hidden) {
    showNativeNotification(title, {
      body,
      tag: `new-order-${order.id}`,
      data: { url: slug ? `/admin/${slug}/order/${order.id}` : `/admin` }
    });
  }
}
