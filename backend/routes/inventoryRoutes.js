const express = require('express');
const router = express.Router();
const {
  getInventory,
  createProduct,
  updateProduct,
  createCombo,
  deleteProduct,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  createProductsBulk
} = require('../controllers/inventoryController');
const { requireStoreAdmin, requireAdmin } = require('../middleware/authMiddleware');
const prisma = require('../prismaClient');

/**
 * Middleware que verifica que un producto/categoría por ID pertenezca
 * a la tienda del admin autenticado. SUPERADMIN puede editar cualquier recurso.
 */
const requireResourceOwnership = (resourceType) => async (req, res, next) => {
  requireAdmin(req, res, async () => {
    if (req.user.role === 'SUPERADMIN') return next();

    try {
      const id = Number(req.params.id);
      let record;

      if (resourceType === 'product') {
        record = await prisma.product.findUnique({ where: { id } });
      } else if (resourceType === 'category') {
        record = await prisma.category.findUnique({ where: { id } });
      }

      if (!record) {
        return res.status(404).json({ error: `${resourceType === 'product' ? 'Producto' : 'Categoría'} no encontrado` });
      }

      if (record.store_id !== req.user.store_id) {
        return res.status(403).json({ error: 'Acceso denegado. Este recurso no pertenece a tu tienda.' });
      }

      next();
    } catch (err) {
      console.error('Error verificando ownership:', err);
      return res.status(500).json({ error: 'Error interno verificando permisos' });
    }
  });
};

// Obtener inventario de una tienda
router.get('/:slug/inventory', requireStoreAdmin, getInventory);

// Crear producto individual
router.post('/:slug/products', requireStoreAdmin, createProduct);

// Crear productos en batch (Excel/CSV)
router.post('/:slug/products/bulk', requireStoreAdmin, createProductsBulk);

// Crear combo
router.post('/:slug/combos', requireStoreAdmin, createCombo);

// Actualizar producto o combo (verifica que pertenezca a la tienda del admin)
router.put('/products/:id', requireResourceOwnership('product'), updateProduct);

// Eliminar producto o combo
router.delete('/products/:id', requireResourceOwnership('product'), deleteProduct);

// ================= CATEGORÍAS ================= //
router.get('/:slug/categories', requireStoreAdmin, getCategories);
router.post('/:slug/categories', requireStoreAdmin, createCategory);
router.put('/categories/:id', requireResourceOwnership('category'), updateCategory);
router.delete('/categories/:id', requireResourceOwnership('category'), deleteCategory);

module.exports = router;
