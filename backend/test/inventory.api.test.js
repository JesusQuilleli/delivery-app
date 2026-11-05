const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { req, adminToken, clientToken, getDemoProduct, prisma } = require('./helpers');

const admin = adminToken();
const adminOtherStore = adminToken(7777);
const client = clientToken(1);

let createdProductIds = [];
let createdCategoryIds = [];
let createdComboId = [];

before(async () => {
  const testProducts = await prisma.product.findMany({
    where: { name: { contains: 'TEST-INV' } },
    select: { id: true }
  });
  const testProductIds = testProducts.map(p => p.id);

  if (testProductIds.length > 0) {
    await prisma.comboItem.deleteMany({ where: { product_id: { in: testProductIds } } });
    await prisma.orderItem.deleteMany({ where: { product_id: { in: testProductIds } } });
    await prisma.product.deleteMany({ where: { id: { in: testProductIds } } });
  }

  await prisma.category.deleteMany({ where: { name: { contains: 'TEST-INV' } } });
});

after(async () => {
  for (const id of createdComboId) {
    await prisma.comboItem.deleteMany({ where: { combo_id: id } });
    await prisma.product.delete({ where: { id } }).catch(() => {});
  }
  for (const id of createdProductIds) {
    await prisma.product.delete({ where: { id } }).catch(() => {});
  }
  for (const id of createdCategoryIds) {
    await prisma.category.delete({ where: { id } }).catch(() => {});
  }
});

test('inventory: GET productos público de la tienda', async () => {
  const res = await req('GET', '/stores/demo-farmacia/products');
  assert.equal(res.status, 200);
  assert.ok(res.json.products.length > 0);
});

test('inventory: crear producto con token ADMIN', async () => {
  const res = await req('POST', '/inventory/demo-farmacia/products', {
    token: admin,
    body: { name: `TEST-INV-${Date.now()}`, price: 12.5, stock: 5, is_available: true }
  });
  assert.equal(res.status, 200, JSON.stringify(res.json));
  createdProductIds.push(res.json.product.id);
});

test('inventory: crear producto sin auth da 401', async () => {
  const res = await req('POST', '/inventory/demo-farmacia/products', {
    body: { name: 'x', price: 1 }
  });
  assert.equal(res.status, 401, JSON.stringify(res.json));
});

test('inventory: crear producto con rol CLIENT da 403', async () => {
  const res = await req('POST', '/inventory/demo-farmacia/products', {
    token: client,
    body: { name: 'x', price: 1 }
  });
  assert.equal(res.status, 403, JSON.stringify(res.json));
});

test('inventory: crear producto con precio negativo debe rechazarse (BUG?)', async () => {
  const res = await req('POST', '/inventory/demo-farmacia/products', {
    token: admin,
    body: { name: `TEST-INV-neg-${Date.now()}`, price: -50, stock: 1 }
  });
  if (res.status === 200) {
    createdProductIds.push(res.json.product.id);
    assert.fail(`BUG: precio negativo aceptado (200) sin validación. product_id=${res.json.product.id}`);
  }
  assert.equal(res.status, 400, JSON.stringify(res.json));
});

test('inventory: actualizar producto', async () => {
  const res = await req('POST', '/inventory/demo-farmacia/products', {
    token: admin,
    body: { name: `TEST-INV-upd-${Date.now()}`, price: 5 }
  });
  const id = res.json.product.id;
  createdProductIds.push(id);
  const upd = await req('PUT', `/inventory/products/${id}`, { token: admin, body: { price: 9.99 } });
  assert.equal(upd.status, 200, JSON.stringify(upd.json));
  assert.equal(upd.json.product.price, 9.99);
});

test('inventory: actualizar producto de otra tienda da 403', async () => {
  const res = await req('POST', '/inventory/demo-farmacia/products', {
    token: admin,
    body: { name: `TEST-INV-own-${Date.now()}`, price: 5 }
  });
  const id = res.json.product.id;
  createdProductIds.push(id);
  const upd = await req('PUT', `/inventory/products/${id}`, { token: adminOtherStore, body: { price: 1 } });
  assert.equal(upd.status, 403, JSON.stringify(upd.json));
});

test('inventory: crear categoría', async () => {
  const res = await req('POST', '/inventory/demo-farmacia/categories', {
    token: admin,
    body: { name: `TEST-INV-cat-${Date.now()}` }
  });
  assert.equal(res.status, 200, JSON.stringify(res.json));
  createdCategoryIds.push(res.json.category.id);
});

test('inventory: crear combo', async () => {
  const product = await getDemoProduct();
  const res = await req('POST', '/inventory/demo-farmacia/combos', {
    token: admin,
    body: { name: `TEST-INV-combo-${Date.now()}`, price: 30, combo_items: [{ product_id: product.id, quantity: 2 }] }
  });
  assert.equal(res.status, 200, JSON.stringify(res.json));
  assert.equal(res.json.product.is_combo, true);
  createdComboId.push(res.json.product.id);
});

test('inventory: crear combo sin items da 400', async () => {
  const res = await req('POST', '/inventory/demo-farmacia/combos', {
    token: admin,
    body: { name: 'combo-vacio', price: 10, combo_items: [] }
  });
  assert.equal(res.status, 400, JSON.stringify(res.json));
});

test('inventory: bulk crear productos', async () => {
  const res = await req('POST', '/inventory/demo-farmacia/products/bulk', {
    token: admin,
    body: { products: [{ name: `TEST-INV-bulk-${Date.now()}`, price: 1.5 }] }
  });
  assert.equal(res.status, 200, JSON.stringify(res.json));
  assert.equal(res.json.count, 1);
});

test('inventory: eliminar producto', async () => {
  const res = await req('POST', '/inventory/demo-farmacia/products', {
    token: admin,
    body: { name: `TEST-INV-del-${Date.now()}`, price: 3 }
  });
  const id = res.json.product.id;
  const del = await req('DELETE', `/inventory/products/${id}`, { token: admin });
  assert.equal(del.status, 200, JSON.stringify(del.json));
});

test('inventory: eliminar producto de otra tienda da 403', async () => {
  const res = await req('POST', '/inventory/demo-farmacia/products', {
    token: admin,
    body: { name: `TEST-INV-delown-${Date.now()}`, price: 3 }
  });
  const id = res.json.product.id;
  createdProductIds.push(id);
  const del = await req('DELETE', `/inventory/products/${id}`, { token: adminOtherStore });
  assert.equal(del.status, 403, JSON.stringify(del.json));
});

test('F2-14: rechazar categoría de otra tienda al crear producto (400)', async () => {
  // Crear categoría en tienda 36 (demo-comida)
  const otherCat = await prisma.category.create({
    data: { name: `TEST-INV-othercat-${Date.now()}`, store_id: 36 }
  });
  createdCategoryIds.push(otherCat.id);

  const res = await req('POST', '/inventory/demo-farmacia/products', {
    token: admin,
    body: { name: `TEST-INV-alien-${Date.now()}`, price: 4.5, category_id: otherCat.id }
  });
  assert.equal(res.status, 400, JSON.stringify(res.json));
});

test('F2-15: rechazar componentes de combo que pertenecen a otra tienda (400)', async () => {
  const alienProduct = await prisma.product.create({
    data: { name: `TEST-INV-alienprod-${Date.now()}`, price: 5, store_id: 36, is_available: true }
  });
  createdProductIds.push(alienProduct.id);

  const res = await req('POST', '/inventory/demo-farmacia/combos', {
    token: admin,
    body: {
      name: `TEST-INV-badcombo-${Date.now()}`,
      price: 15,
      combo_items: [{ product_id: alienProduct.id, quantity: 1 }]
    }
  });
  assert.equal(res.status, 400, JSON.stringify(res.json));
});

test('F2-16 & F2-17: calcular stock dinámico de combo según componentes', async () => {
  const prodA = await req('POST', '/inventory/demo-farmacia/products', {
    token: admin,
    body: { name: `TEST-INV-compA-${Date.now()}`, price: 2, stock: 10, is_available: true }
  });
  const prodB = await req('POST', '/inventory/demo-farmacia/products', {
    token: admin,
    body: { name: `TEST-INV-compB-${Date.now()}`, price: 3, stock: 6, is_available: true }
  });
  createdProductIds.push(prodA.json.product.id, prodB.json.product.id);

  // Combo requiere 1 prodA y 2 prodB -> stock disponible = floor(6 / 2) = 3
  const comboRes = await req('POST', '/inventory/demo-farmacia/combos', {
    token: admin,
    body: {
      name: `TEST-INV-calc-combo-${Date.now()}`,
      price: 6,
      combo_items: [
        { product_id: prodA.json.product.id, quantity: 1 },
        { product_id: prodB.json.product.id, quantity: 2 }
      ]
    }
  });
  assert.equal(comboRes.status, 200, JSON.stringify(comboRes.json));
  assert.equal(comboRes.json.product.stock, 3);
  createdComboId.push(comboRes.json.product.id);

  // Verificar que el catálogo público de la tienda también calcule el stock
  const pubRes = await req('GET', '/stores/demo-farmacia/products');
  assert.equal(pubRes.status, 200);
  const foundCombo = pubRes.json.products.find(p => p.id === comboRes.json.product.id);
  assert.ok(foundCombo, 'El combo debe estar en el catálogo');
  assert.equal(foundCombo.stock, 3, 'El stock calculado del combo debe ser 3');
});

test('F2-18: rechazar producto con stock negativo (400)', async () => {
  const res = await req('POST', '/inventory/demo-farmacia/products', {
    token: admin,
    body: { name: `TEST-INV-negstock-${Date.now()}`, price: 5, stock: -1 }
  });
  assert.equal(res.status, 400, JSON.stringify(res.json));
});

test('F2-19: bloquear eliminación de producto que es parte de un combo activo (400)', async () => {
  const comp = await req('POST', '/inventory/demo-farmacia/products', {
    token: admin,
    body: { name: `TEST-INV-usedcomp-${Date.now()}`, price: 4, stock: 20, is_available: true }
  });
  const compId = comp.json.product.id;
  createdProductIds.push(compId);

  const combo = await req('POST', '/inventory/demo-farmacia/combos', {
    token: admin,
    body: {
      name: `TEST-INV-guardcombo-${Date.now()}`,
      price: 10,
      combo_items: [{ product_id: compId, quantity: 1 }]
    }
  });
  const comboId = combo.json.product.id;
  createdComboId.push(comboId);

  // Intentar eliminar el componente mientras el combo existe
  const delComp = await req('DELETE', `/inventory/products/${compId}`, { token: admin });
  assert.equal(delComp.status, 400, 'Debe devolver 400 al intentar borrar componente de combo');

  // Si se elimina el combo primero, luego sí se puede eliminar el componente
  const delCombo = await req('DELETE', `/inventory/products/${comboId}`, { token: admin });
  assert.equal(delCombo.status, 200, 'Eliminación del combo debe tener éxito');

  const delCompAfter = await req('DELETE', `/inventory/products/${compId}`, { token: admin });
  assert.equal(delCompAfter.status, 200, 'Eliminación del componente debe tener éxito tras borrar el combo');
});
