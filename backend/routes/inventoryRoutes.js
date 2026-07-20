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
  deleteCategory
} = require('../controllers/inventoryController');
const { requireAdmin } = require('../middleware/authMiddleware');

// Obtener inventario de una tienda
router.get('/:slug/inventory', requireAdmin, getInventory);

// Crear producto individual
router.post('/:slug/products', requireAdmin, createProduct);

// Crear combo
router.post('/:slug/combos', requireAdmin, createCombo);

// Actualizar producto o combo
router.put('/products/:id', requireAdmin, updateProduct);

// Eliminar producto o combo
router.delete('/products/:id', requireAdmin, deleteProduct);

// ================= CATEGORÍAS ================= //
router.get('/:slug/categories', requireAdmin, getCategories);
router.post('/:slug/categories', requireAdmin, createCategory);
router.put('/categories/:id', requireAdmin, updateCategory);
router.delete('/categories/:id', requireAdmin, deleteCategory);

module.exports = router;
