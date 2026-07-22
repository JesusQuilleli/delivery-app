const express = require('express');
const router = express.Router();
const { getStoreProducts, getStoreOrders, getStoreHistory, getStoreProductDetails, updateStoreSettings, getStoreAnalytics, getStoreCustomers, updateStoreCustomer, deleteStoreCustomer, getStoreDrivers, createStoreDriver, updateStoreDriver, deleteStoreDriver } = require('../controllers/storeController');
const { requireAdmin } = require('../middleware/authMiddleware');

router.get('/:slug/products', getStoreProducts); // Public
router.get('/:slug/products/:productId', getStoreProductDetails); // Public
router.get('/:slug/orders', requireAdmin, getStoreOrders);
router.get('/:slug/history', requireAdmin, getStoreHistory);
router.get('/:slug/analytics', requireAdmin, getStoreAnalytics);
router.put('/:slug/settings', requireAdmin, updateStoreSettings);
router.get('/:slug/customers', requireAdmin, getStoreCustomers);
router.put('/:slug/customers/:id', requireAdmin, updateStoreCustomer);
router.delete('/:slug/customers/:id', requireAdmin, deleteStoreCustomer);

router.get('/:slug/drivers', requireAdmin, getStoreDrivers);
router.post('/:slug/drivers', requireAdmin, createStoreDriver);
router.put('/:slug/drivers/:id', requireAdmin, updateStoreDriver);
router.delete('/:slug/drivers/:id', requireAdmin, deleteStoreDriver);

module.exports = router;
