const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../backend/controllers/orderController.js');
let content = fs.readFileSync(filePath, 'utf8');

const isCrlf = content.includes('\r\n');
let normalized = content.replace(/\r\n/g, '\n');

// 1. Add import
const targetImport = `const { buildStockBreakdown, restoreOrderStock } = require('../services/orderStockService');`;
const replaceImport = `const { buildStockBreakdown, restoreOrderStock } = require('../services/orderStockService');
const { sendOrderDispatchedToCustomer, sendOrderDispatchedToDriver } = require('../services/whatsappService');`;

if (!normalized.includes(targetImport)) {
  console.error('Target import not found!');
  process.exit(1);
}
normalized = normalized.replace(targetImport, replaceImport);

// 2. Add WhatsApp dispatch in updateOrderStatus
const targetDispatch = `    const io = req.app.get('io');
    io.to(\`client_\${order.user_id}\`).emit('estado_actualizado', order);
    io.to(\`order_\${order.id}\`).emit('estado_actualizado', order);
    io.to(\`store_\${order.store_id}\`).emit('pedido_actualizado', order);

    res.json({ message: 'Estado actualizado', order });`;

const replaceDispatch = `    const io = req.app.get('io');
    io.to(\`client_\${order.user_id}\`).emit('estado_actualizado', order);
    io.to(\`order_\${order.id}\`).emit('estado_actualizado', order);
    io.to(\`store_\${order.store_id}\`).emit('pedido_actualizado', order);

    // F2-33: Notificaciones automáticas por WhatsApp al cliente y al motorizado al despachar
    if (status === 'DISPATCHED') {
      try {
        const store = await prisma.store.findUnique({
          where: { id: order.store_id },
          select: { name: true, phone: true, currency: true }
        });

        if (order.user && order.user.phone) {
          sendOrderDispatchedToCustomer(order, store).catch(err => {
            console.error('[WHATSAPP] Error notificando cliente:', err.message);
          });
        }

        if (order.driver && order.driver.phone) {
          sendOrderDispatchedToDriver(order, store, order.driver).catch(err => {
            console.error('[WHATSAPP] Error enviando asignación a motorizado:', err.message);
          });
        }
      } catch (dispatchErr) {
        console.error('[WHATSAPP] Error en despacho de mensajes:', dispatchErr.message);
      }
    }

    res.json({ message: 'Estado actualizado', order });`;

if (!normalized.includes(targetDispatch)) {
  console.error('Target dispatch not found!');
  process.exit(1);
}
normalized = normalized.replace(targetDispatch, replaceDispatch);

// 3. Add in batchUpdateStatus
const targetBatch = `    for (const order of updatedOrders) {
      io.to(\`client_\${order.user_id}\`).emit('estado_actualizado', order);
      io.to(\`order_\${order.id}\`).emit('estado_actualizado', order);
      io.to(\`store_\${order.store_id}\`).emit('pedido_actualizado', order);
    }

    res.json({ message: \`\${result.count} pedidos actualizados\`, updated: result.count, failed: [...deniedIds, ...invalidTransitionIds] });`;

const replaceBatch = `    for (const order of updatedOrders) {
      io.to(\`client_\${order.user_id}\`).emit('estado_actualizado', order);
      io.to(\`order_\${order.id}\`).emit('estado_actualizado', order);
      io.to(\`store_\${order.store_id}\`).emit('pedido_actualizado', order);
    }

    if (status === 'DISPATCHED') {
      for (const order of updatedOrders) {
        try {
          const store = await prisma.store.findUnique({
            where: { id: order.store_id },
            select: { name: true, phone: true, currency: true }
          });
          if (order.user && order.user.phone) {
            sendOrderDispatchedToCustomer(order, store).catch(() => {});
          }
          if (order.driver && order.driver.phone) {
            sendOrderDispatchedToDriver(order, store, order.driver).catch(() => {});
          }
        } catch (e) {
          console.error('[WHATSAPP_BATCH] Error despachando WhatsApp:', e.message);
        }
      }
    }

    res.json({ message: \`\${result.count} pedidos actualizados\`, updated: result.count, failed: [...deniedIds, ...invalidTransitionIds] });`;

if (!normalized.includes(targetBatch)) {
  console.error('Target batch not found!');
  process.exit(1);
}
normalized = normalized.replace(targetBatch, replaceBatch);

const finalContent = isCrlf ? normalized.replace(/\n/g, '\r\n') : normalized;
fs.writeFileSync(filePath, finalContent, 'utf8');
console.log('Successfully updated backend/controllers/orderController.js with WhatsApp dispatch triggers!');
