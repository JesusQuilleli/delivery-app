// backend/test/inventory.unit.test.js
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  computeComboStock,
  isLowStock,
  isOutOfStock,
  formatProductWithStock
} = require('../utils/inventory');

describe('inventory utils (unit)', () => {
  it('retorna el stock directo si no es combo', () => {
    assert.equal(computeComboStock({ is_combo: false, stock: 10 }), 10);
    assert.equal(computeComboStock({ is_combo: false, stock: null }), null);
  });

  it('retorna 0 si el combo no tiene items', () => {
    assert.equal(computeComboStock({ is_combo: true, comboItems: [] }), 0);
  });

  it('calcula el stock mínimo como floor(stock / qty) entre todos los componentes', () => {
    const combo = {
      is_combo: true,
      comboItems: [
        { product: { name: 'Carne', stock: 50, is_available: true }, quantity: 1 },
        { product: { name: 'Pan', stock: 25, is_available: true }, quantity: 1 },
        { product: { name: 'Papas', stock: 10, is_available: true }, quantity: 2 } // 10 / 2 = 5
      ]
    };
    assert.equal(computeComboStock(combo), 5);
  });

  it('retorna 0 si algún componente no está disponible', () => {
    const combo = {
      is_combo: true,
      comboItems: [
        { product: { name: 'Carne', stock: 50, is_available: true }, quantity: 1 },
        { product: { name: 'Pan', stock: 25, is_available: false }, quantity: 1 }
      ]
    };
    assert.equal(computeComboStock(combo), 0);
  });

  it('retorna 0 si algún componente tiene stock 0', () => {
    const combo = {
      is_combo: true,
      comboItems: [
        { product: { name: 'Carne', stock: 50, is_available: true }, quantity: 1 },
        { product: { name: 'Pan', stock: 0, is_available: true }, quantity: 1 }
      ]
    };
    assert.equal(computeComboStock(combo), 0);
  });

  it('retorna null (ilimitado) si todos los componentes tienen stock null', () => {
    const combo = {
      is_combo: true,
      comboItems: [
        { product: { name: 'Carne', stock: null, is_available: true }, quantity: 1 },
        { product: { name: 'Pan', stock: null, is_available: true }, quantity: 1 }
      ]
    };
    assert.equal(computeComboStock(combo), null);
  });

  it('ignora componentes ilimitados si hay al menos uno con stock limitado', () => {
    const combo = {
      is_combo: true,
      comboItems: [
        { product: { name: 'Carne', stock: null, is_available: true }, quantity: 1 },
        { product: { name: 'Pan', stock: 8, is_available: true }, quantity: 2 } // 8 / 2 = 4
      ]
    };
    assert.equal(computeComboStock(combo), 4);
  });

  it('detecta bajo stock (1 a 5) y agotado (<= 0)', () => {
    assert.equal(isLowStock(5), true);
    assert.equal(isLowStock(1), true);
    assert.equal(isLowStock(6), false);
    assert.equal(isLowStock(0), false);
    assert.equal(isLowStock(null), false);

    assert.equal(isOutOfStock(0), true);
    assert.equal(isOutOfStock(-1), true);
    assert.equal(isOutOfStock(1), false);
    assert.equal(isOutOfStock(null), false);
  });

  it('formatProductWithStock adjunta metadatos correctos', () => {
    const formatted = formatProductWithStock({
      id: 1,
      name: 'Test',
      is_combo: false,
      stock: 3
    });
    assert.equal(formatted.stock, 3);
    assert.equal(formatted.is_low_stock, true);
    assert.equal(formatted.is_out_of_stock, false);
  });
});
