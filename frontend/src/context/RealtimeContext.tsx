import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import api from '../api';
import { AuthContext } from './AuthContext';
import { createSocket } from '../lib/socket';
import { notifyOrderUpdate } from '../lib/notifications';

export interface RealtimeOrder {
  id: number;
  status: string;
  delivery_address?: string | null;
  estimated_minutes?: number | null;
}

type OrderHandler = (order: RealtimeOrder) => void;

interface RealtimeContextValue {
  connected: boolean;
  subscribe: (handler: OrderHandler) => () => void;
}

const RealtimeContext = createContext<RealtimeContextValue>({
  connected: false,
  subscribe: () => () => {},
});

export const useClientRealtime = () => useContext(RealtimeContext);

export const RealtimeProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useContext(AuthContext);
  const handlersRef = useRef<Set<OrderHandler>>(new Set());
  const lastStatusRef = useRef<Map<number, string>>(new Map());
  const seededRef = useRef(false);
  const [connected, setConnected] = useState(false);

  const subscribe = useCallback((handler: OrderHandler) => {
    handlersRef.current.add(handler);
    return () => {
      handlersRef.current.delete(handler);
    };
  }, []);

  useEffect(() => {
    if (!user?.id || (user.role && user.role !== 'CLIENT')) return;

    lastStatusRef.current = new Map();
    seededRef.current = false;
    let cancelled = false;
    const socket = createSocket();

    const dispatch = (order: RealtimeOrder, notify: boolean) => {
      if (!order?.id) return;
      const previous = lastStatusRef.current.get(order.id);
      lastStatusRef.current.set(order.id, order.status);
      if (notify && previous !== order.status) {
        notifyOrderUpdate(order);
      }
      handlersRef.current.forEach((handler) => handler(order));
    };

    const syncFromDb = async () => {
      try {
        const res = await api.get('/orders/my-orders');
        if (cancelled) return;
        const orders: RealtimeOrder[] = Array.isArray(res.data) ? res.data : [];

        if (!seededRef.current) {
          orders.forEach((order) => lastStatusRef.current.set(order.id, order.status));
          seededRef.current = true;
          return;
        }

        orders.forEach((order) => {
          const previous = lastStatusRef.current.get(order.id);
          if (previous === undefined) {
            lastStatusRef.current.set(order.id, order.status);
            return;
          }
          if (previous !== order.status) {
            dispatch(order, true);
          }
        });
      } catch {
        // Sin conexión: el siguiente ciclo o el socket reanudan la sincronización.
      }
    };

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_client', user.id);
      void syncFromDb();
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));
    socket.on('estado_actualizado', (order: RealtimeOrder) => dispatch(order, true));

    const interval = window.setInterval(() => {
      if (!socket.connected) void syncFromDb();
    }, 30000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !socket.connected) {
        void syncFromDb();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    void syncFromDb();

    return () => {
      cancelled = true;
      setConnected(false);
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      socket.disconnect();
    };
  }, [user?.id, user?.role]);

  const value = useMemo(() => ({ connected, subscribe }), [connected, subscribe]);

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
};
