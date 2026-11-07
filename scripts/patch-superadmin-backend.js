const fs = require('fs');
const path = require('path');

// 1. Update superadminController.js with deleteStore
const controllerPath = path.resolve(__dirname, '../backend/controllers/superadminController.js');
let controllerContent = fs.readFileSync(controllerPath, 'utf8');

const deleteStoreFunc = `
const deleteStore = async (req, res) => {
  try {
    const { id } = req.params;
    const store = await prisma.store.findUnique({
      where: { id: Number(id) }
    });
    if (!store) {
      return res.status(404).json({ error: 'Tienda no encontrada' });
    }

    const actor = req.user?.username || req.user?.name || 'SUPERADMIN';

    await prisma.$transaction(async (tx) => {
      // 1. Eliminar ítems de órdenes de la tienda
      await tx.orderItem.deleteMany({
        where: { order: { store_id: Number(id) } }
      });
      // 2. Eliminar órdenes
      await tx.order.deleteMany({
        where: { store_id: Number(id) }
      });
      // 3. Eliminar cotizaciones de récipe
      await tx.prescriptionQuote.deleteMany({
        where: { store_id: Number(id) }
      });
      // 4. Eliminar combo items de productos de esta tienda
      await tx.comboItem.deleteMany({
        where: { product: { store_id: Number(id) } }
      });
      // 5. Eliminar productos
      await tx.product.deleteMany({
        where: { store_id: Number(id) }
      });
      // 6. Eliminar categorías
      await tx.category.deleteMany({
        where: { store_id: Number(id) }
      });
      // 7. Eliminar motorizados
      await tx.driver.deleteMany({
        where: { store_id: Number(id) }
      });
      // 8. Eliminar zonas de entrega
      await tx.deliveryZone.deleteMany({
        where: { store_id: Number(id) }
      });
      // 9. Eliminar clientes registrados en la tienda
      await tx.storeCustomer.deleteMany({
        where: { store_id: Number(id) }
      });
      // 10. Eliminar usuarios de la tienda (no superadmins)
      await tx.user.deleteMany({
        where: { store_id: Number(id), role: { not: 'SUPERADMIN' } }
      });
      // 11. Eliminar la tienda
      await tx.store.delete({
        where: { id: Number(id) }
      });
    }, { maxWait: 15000, timeout: 30000 });

    console.log(\`[AUDIT] STORE_DELETED: Tienda '\${store.name}' (ID: \${store.id}, Slug: '\${store.slug}') eliminada por \${actor}.\`);

    res.json({ success: true, message: \`Tienda '\${store.name}' eliminada correctamente.\` });
  } catch (error) {
    console.error('Error eliminando tienda:', error);
    res.status(500).json({ error: 'Error interno al eliminar la tienda: ' + error.message });
  }
};
`;

if (!controllerContent.includes('deleteStore = async')) {
  controllerContent = controllerContent.replace('module.exports = {', `${deleteStoreFunc}\nmodule.exports = {\n  deleteStore,`);
  fs.writeFileSync(controllerPath, controllerContent, 'utf8');
  console.log('Added deleteStore to superadminController.js');
} else {
  console.log('deleteStore already in superadminController.js');
}

// 2. Update superadminRoutes.js
const routesPath = path.resolve(__dirname, '../backend/routes/superadminRoutes.js');
let routesContent = fs.readFileSync(routesPath, 'utf8');

if (!routesContent.includes('deleteStore')) {
  routesContent = routesContent.replace('toggleStoreStatus,', 'toggleStoreStatus,\n  deleteStore,');
  routesContent = routesContent.replace(
    "router.put('/stores/:id/status', adminLimiter, requireSuperAdmin, toggleStoreStatus);",
    "router.put('/stores/:id/status', adminLimiter, requireSuperAdmin, toggleStoreStatus);\nrouter.delete('/stores/:id', adminLimiter, requireSuperAdmin, deleteStore);"
  );
  fs.writeFileSync(routesPath, routesContent, 'utf8');
  console.log('Added DELETE /stores/:id to superadminRoutes.js');
} else {
  console.log('DELETE /stores/:id already in superadminRoutes.js');
}
