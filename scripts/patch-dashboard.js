const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../frontend/src/pages/Dashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const isCrlf = content.includes('\r\n');
let normalized = content.replace(/\r\n/g, '\n');

// 1. Update imports to include notifyAdminNewOrder and requestNotificationPermission
const targetImport = `import { playOrderChime } from '../lib/notifications';`;
const replaceImport = `import { playOrderChime, notifyAdminNewOrder, requestNotificationPermission } from '../lib/notifications';`;

if (!normalized.includes(targetImport)) {
  console.error('Target import not found in Dashboard.tsx!');
  process.exit(1);
}
normalized = normalized.replace(targetImport, replaceImport);

// 2. Add storeConfigRef and update enqueuePendingAlerts, fetchOrders, and useEffect
const targetEnqueue = `  // Alerta las órdenes pendientes no vistas que el fetch trae (p. ej. las que
  // llegaron mientras el admin estaba offline o con el socket desconectado),
  // igual que si hubieran llegado en vivo, sin duplicar las ya alertadas.
  const enqueuePendingAlerts = useCallback((orders: Order[]) => {
    const newPending = orders
      .filter(o => isNuevas(o.status) && !o.viewed && !alertedPendingIds.current.has(o.id))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    if (newPending.length === 0) return;

    setAlertQueue(prev => {
      const existing = new Set(prev.map(o => o.id));
      const toAdd = newPending.filter(o => !existing.has(o.id));
      return [...prev, ...toAdd];
    });
    newPending.forEach(o => alertedPendingIds.current.add(o.id));

    playOrderChime();
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }

    if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
      newPending.slice(0, 5).forEach((order: Order) => {
        const notif = new Notification("¡Nuevo Pedido!", {
          body: \`\${formatPrice(order.total_amount, storeConfig?.currency)} - \${order.delivery_address.split(' |')[0]}\`,
          icon: '/favicon.ico'
        });
        notif.onclick = () => { window.focus(); notif.close(); };
      });
    }
  }, [storeConfig]);

  const fetchOrders = useCallback(async () => {
    if (!slug) return;
    try {
      const res = await api.get(\`/stores/\${slug}/orders\`);
      setOrders(res.data.orders);
      if (res.data.storeId) {
        setStoreId(res.data.storeId);
      }
      enqueuePendingAlerts(res.data.orders);
    } catch (error) {
      console.error("Error cargando dashboard", error);
    }
  }, [slug, enqueuePendingAlerts]);

  const fetchStoreConfig = useCallback(async () => {
    if (!slug) return;
    try {
      const res = await api.get(\`/stores/\${slug}/products?limit=1\`);
      if (res.data.store) {
        setStoreConfig(res.data.store);
      }
    } catch (error) {
      console.error("Error cargando config de tienda", error);
    }
  }, [slug]);

  const fetchDrivers = useCallback(async () => {
    if (!slug) return;
    try {
      const res = await api.get(\`/stores/\${slug}/drivers\`);
      setDrivers(res.data.drivers.filter((d: Driver) => d.is_active));
    } catch (error) {
      console.error("Error cargando motorizados", error);
    }
  }, [slug]);

  useEffect(() => {
    fetchOrders();
    fetchStoreConfig();
    fetchDrivers();
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [fetchOrders, fetchStoreConfig, fetchDrivers]);`;

const replaceEnqueue = `  const storeConfigRef = useRef<any>(null);
  storeConfigRef.current = storeConfig;

  // Alerta las órdenes pendientes no vistas que el fetch trae
  const enqueuePendingAlerts = useCallback((orders: Order[]) => {
    const newPending = orders
      .filter(o => isNuevas(o.status) && !o.viewed && !alertedPendingIds.current.has(o.id))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    if (newPending.length === 0) return;

    setAlertQueue(prev => {
      const existing = new Set(prev.map(o => o.id));
      const toAdd = newPending.filter(o => !existing.has(o.id));
      return [...prev, ...toAdd];
    });
    newPending.forEach(o => alertedPendingIds.current.add(o.id));

    playOrderChime(true);
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }

    newPending.slice(0, 3).forEach((order: Order) => {
      notifyAdminNewOrder(order, storeConfigRef.current?.currency, slug || '');
    });
  }, [slug]);

  const fetchOrders = useCallback(async () => {
    if (!slug) return;
    try {
      const res = await api.get(\`/stores/\${slug}/orders\`);
      setOrders(res.data.orders);
      if (res.data.storeId) {
        setStoreId(res.data.storeId);
      }
      enqueuePendingAlerts(res.data.orders);
    } catch (error) {
      console.error("Error cargando dashboard", error);
    }
  }, [slug, enqueuePendingAlerts]);

  const fetchStoreConfig = useCallback(async () => {
    if (!slug) return;
    try {
      const res = await api.get(\`/stores/\${slug}/products?limit=1\`);
      if (res.data.store) {
        setStoreConfig(res.data.store);
      }
    } catch (error) {
      console.error("Error cargando config de tienda", error);
    }
  }, [slug]);

  const fetchDrivers = useCallback(async () => {
    if (!slug) return;
    try {
      const res = await api.get(\`/stores/\${slug}/drivers\`);
      setDrivers(res.data.drivers.filter((d: Driver) => d.is_active));
    } catch (error) {
      console.error("Error cargando motorizados", error);
    }
  }, [slug]);

  // Ejecución limpia sin bucles al montar o cambiar de tienda
  useEffect(() => {
    fetchOrders();
    fetchStoreConfig();
    fetchDrivers();
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      requestNotificationPermission();
    }
  }, [slug]);`;

if (!normalized.includes(targetEnqueue)) {
  console.error('Target enqueue not found in Dashboard.tsx!');
  process.exit(1);
}
normalized = normalized.replace(targetEnqueue, replaceEnqueue);

// 3. Update socket nuevo_pedido handler
const targetSocket = `      socket.on('nuevo_pedido', (order: Order) => {
        setOrders(prev => [order, ...prev]);
        setAlertQueue(prev => [...prev, order]);

        playOrderChime();
        if (audioRef.current) {
          audioRef.current.play().catch(() => {});
        }

        if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
          const notif = new Notification("¡Nuevo Pedido!", {
            body: \`\${formatPrice(order.total_amount, storeConfig?.currency)} - \${order.delivery_address.split(' |')[0]}\`,
            icon: '/favicon.ico'
          });
          notif.onclick = () => { window.focus(); notif.close(); };
        }
      });`;

const replaceSocket = `      socket.on('nuevo_pedido', (order: Order) => {
        setOrders(prev => [order, ...prev]);
        setAlertQueue(prev => [...prev, order]);
        alertedPendingIds.current.add(order.id);

        playOrderChime(true);
        if (audioRef.current) {
          audioRef.current.play().catch(() => {});
        }

        notifyAdminNewOrder(order, storeConfigRef.current?.currency, slug || '');
      });`;

if (!normalized.includes(targetSocket)) {
  console.error('Target socket not found in Dashboard.tsx!');
  process.exit(1);
}
normalized = normalized.replace(targetSocket, replaceSocket);

// 4. Update approval buttons in Table View (require viewing details first)
const targetTableButtons = `                              {order.status === 'AWAITING_PAYMENT' && (
                                <>
                                  <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 font-bold rounded-lg h-8 px-2" onClick={(e) => { e.stopPropagation(); handleQuickReject(order); }}>
                                    <XCircle size={14} />
                                  </Button>
                                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 font-bold rounded-lg h-8 px-3 text-xs" onClick={(e) => { e.stopPropagation(); handleQuickApprove(order.id); }}>
                                    <CheckCircle size={14} className="mr-1" /> Aprobar Pago
                                  </Button>
                                </>
                              )}
                              {order.status === 'PENDING' && (
                                <>
                                  <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 font-bold rounded-lg h-8 px-2" onClick={(e) => { e.stopPropagation(); handleQuickReject(order); }}>
                                    <XCircle size={14} />
                                  </Button>
                                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 font-bold rounded-lg h-8 px-3 text-xs" onClick={(e) => { e.stopPropagation(); handleQuickApprove(order.id); }}>
                                    <CheckCircle size={14} className="mr-1" /> Aprobar
                                  </Button>
                                </>
                              )}`;

const replaceTableButtons = `                              {(order.status === 'AWAITING_PAYMENT' || order.status === 'PENDING') && (
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg h-8 px-3 text-xs shadow-sm flex items-center" onClick={(e) => { e.stopPropagation(); navigate(\`/admin/\${slug}/order/\${order.id}\`); }}>
                                  <FileText size={14} className="mr-1.5" /> Ver Detalles
                                </Button>
                              )}`;

if (!normalized.includes(targetTableButtons)) {
  console.error('Target table buttons not found in Dashboard.tsx!');
  process.exit(1);
}
normalized = normalized.replace(targetTableButtons, replaceTableButtons);

// 5. Update approval buttons in Card View (require viewing details first)
const targetCardButtons = `                      {order.status === 'AWAITING_PAYMENT' ? (
                        <div className="flex gap-2 w-full">
                          <Button variant="outline" size="sm" className="flex-1 font-bold text-red-600 border-red-200 hover:bg-red-50 rounded-lg" onClick={() => handleQuickReject(order)}>
                            <XCircle size={14} className="mr-1" /> Rechazar
                          </Button>
                          <Button size="sm" className="flex-[2] font-bold bg-blue-600 hover:bg-blue-700 rounded-lg" onClick={() => handleQuickApprove(order.id)}>
                            <CheckCircle size={14} className="mr-1" /> Aprobar Pago
                          </Button>
                        </div>
                      ) : order.status === 'PENDING' ? (
                        <div className="flex gap-2 w-full">
                          <Button variant="outline" size="sm" className="flex-1 font-bold text-red-600 border-red-200 hover:bg-red-50 rounded-lg" onClick={() => handleQuickReject(order)}>
                            <XCircle size={14} className="mr-1" /> Rechazar
                          </Button>
                          <Button size="sm" className="flex-[2] font-bold bg-emerald-600 hover:bg-emerald-700 rounded-lg" onClick={() => handleQuickApprove(order.id)}>
                            <CheckCircle size={14} className="mr-1" /> Aprobar
                          </Button>
                        </div>
                      ) :`;

const replaceCardButtons = `                      {(order.status === 'AWAITING_PAYMENT' || order.status === 'PENDING') ? (
                        <Button size="sm" className="w-full font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-9 text-xs shadow-sm flex items-center justify-center" onClick={() => navigate(\`/admin/\${slug}/order/\${order.id}\`)}>
                          <FileText size={14} className="mr-1.5" /> Ver Detalles del Pedido
                        </Button>
                      ) :`;

if (!normalized.includes(targetCardButtons)) {
  console.error('Target card buttons not found in Dashboard.tsx!');
  process.exit(1);
}
normalized = normalized.replace(targetCardButtons, replaceCardButtons);

const finalContent = isCrlf ? normalized.replace(/\n/g, '\r\n') : normalized;
fs.writeFileSync(filePath, finalContent, 'utf8');
console.log('Successfully updated frontend/src/pages/Dashboard.tsx!');
