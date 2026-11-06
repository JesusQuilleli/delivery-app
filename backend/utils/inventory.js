// backend/utils/inventory.js

const LOW_STOCK_THRESHOLD = 5;

/**
 * Calcula el stock efectivo disponible para un combo en base al stock de sus componentes.
 * Si algún componente no está disponible o su stock es 0, el combo tiene 0 disponible.
 * Si todos los componentes tienen stock ilimitado (null), el combo tiene stock ilimitado (null).
 * Si hay componentes con stock finito, el stock del combo es el mínimo de floor(stock_componente / cantidad_en_combo).
 *
 * @param {object} combo - Objeto producto con is_combo y comboItems
 * @returns {number|null}
 */
function computeComboStock(combo) {
  if (!combo || !combo.is_combo) {
    return combo?.stock ?? null;
  }

  const items = combo.comboItems || [];
  if (items.length === 0) {
    return 0; // Un combo sin componentes no se puede preparar
  }

  let minAvailable = null;

  for (const item of items) {
    const component = item.product;
    const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;

    // Si el componente no existe o no está disponible, el combo está agotado
    if (!component || component.is_available === false) {
      return 0;
    }

    if (component.stock !== null && component.stock !== undefined) {
      const stockNum = Number(component.stock);
      if (stockNum < 0) return 0;
      const possibleCombos = Math.floor(stockNum / qty);
      if (minAvailable === null || possibleCombos < minAvailable) {
        minAvailable = possibleCombos;
      }
    }
  }

  return minAvailable;
}

/**
 * Evalúa si un nivel de stock califica como stock bajo.
 */
function isLowStock(stock) {
  return stock !== null && stock !== undefined && stock <= LOW_STOCK_THRESHOLD && stock > 0;
}

/**
 * Evalúa si un nivel de stock califica como agotado.
 */
function isOutOfStock(stock) {
  return stock !== null && stock !== undefined && stock <= 0;
}

/**
 * Normaliza un producto agregando su stock efectivo y metadatos de disponibilidad.
 */
function formatProductWithStock(product) {
  if (!product) return product;

  const effectiveStock = product.is_combo ? computeComboStock(product) : (product.stock !== undefined ? product.stock : null);

  const isExpired = Boolean(product.expires_at && new Date(product.expires_at).getTime() < Date.now());
  const isExpiringSoon = Boolean(
    !isExpired &&
    product.expires_at &&
    new Date(product.expires_at).getTime() - Date.now() < 60 * 24 * 60 * 60 * 1000
  );

  return {
    ...product,
    stock: effectiveStock,
    is_low_stock: isLowStock(effectiveStock),
    is_out_of_stock: isOutOfStock(effectiveStock),
    is_expired: isExpired,
    is_expiring_soon: isExpiringSoon,
    is_available: isExpired ? false : product.is_available
  };
}

module.exports = {
  LOW_STOCK_THRESHOLD,
  computeComboStock,
  isLowStock,
  isOutOfStock,
  formatProductWithStock
};
