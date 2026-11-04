const buildStockBreakdown = (requiredStock) => {
  if (!(requiredStock instanceof Map)) return [];
  return [...requiredStock.entries()]
    .filter(([productId, quantity]) => Number.isInteger(productId) && Number.isInteger(quantity) && quantity > 0)
    .map(([productId, quantity]) => ({ product_id: productId, quantity }));
};

const deriveBreakdownFromOrder = (order) => {
  const breakdown = new Map();

  for (const item of order.items || []) {
    const product = item.product;
    if (!product) continue;

    if (product.is_combo) {
      for (const component of product.comboItems || []) {
        if (component.product && component.product.stock !== null) {
          breakdown.set(component.product.id, (breakdown.get(component.product.id) || 0) + item.quantity * component.quantity);
        }
      }
    } else if (product.stock !== null) {
      breakdown.set(product.id, (breakdown.get(product.id) || 0) + item.quantity);
    }
  }

  return buildStockBreakdown(breakdown);
};

const restoreOrderStock = async (tx, orderId, { allowDelivered = false } = {}) => {
  const order = await tx.order.findUnique({
    where: { id: Number(orderId) },
    include: {
      items: {
        include: {
          product: {
            include: {
              comboItems: { include: { product: true } }
            }
          }
        }
      }
    }
  });

  if (!order) return { restored: false, reason: 'not_found' };
  if (order.stock_restored) return { restored: false, reason: 'already_restored' };
  if (!allowDelivered && order.status === 'DELIVERED') return { restored: false, reason: 'delivered' };

  const breakdown = Array.isArray(order.stock_breakdown) && order.stock_breakdown.length > 0
    ? order.stock_breakdown
    : deriveBreakdownFromOrder(order);

  for (const entry of breakdown) {
    const productId = Number(entry.product_id);
    const quantity = Number(entry.quantity);
    if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity <= 0) continue;

    await tx.product.updateMany({
      where: { id: productId, store_id: order.store_id, stock: { not: null } },
      data: { stock: { increment: quantity } }
    });
  }

  await tx.order.update({
    where: { id: order.id },
    data: { stock_restored: true }
  });

  return { restored: true, products: breakdown.length };
};

module.exports = { buildStockBreakdown, restoreOrderStock };
