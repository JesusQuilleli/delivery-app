const express = require('express');
const router = express.Router();
const { getStoreProducts, getStoreOrders, getStoreHistory, getStoreProductDetails, updateStoreSettings, getStoreAnalytics, getStoreCustomers, updateStoreCustomer, deleteStoreCustomer, getStoreDrivers, createStoreDriver, updateStoreDriver, deleteStoreDriver } = require('../controllers/storeController');
const { requireStoreAdmin } = require('../middleware/authMiddleware');
const { adminLimiter } = require('../middleware/rateLimiter');

router.get('/:slug/products', getStoreProducts); // Public
router.get('/:slug/products/:productId', getStoreProductDetails); // Public
router.get('/:slug/orders', adminLimiter, requireStoreAdmin, getStoreOrders);
router.get('/:slug/history', adminLimiter, requireStoreAdmin, getStoreHistory);
router.get('/:slug/analytics', adminLimiter, requireStoreAdmin, getStoreAnalytics);
router.put('/:slug/settings', adminLimiter, requireStoreAdmin, updateStoreSettings);
router.get('/:slug/customers', adminLimiter, requireStoreAdmin, getStoreCustomers);
router.put('/:slug/customers/:id', adminLimiter, requireStoreAdmin, updateStoreCustomer);
router.delete('/:slug/customers/:id', adminLimiter, requireStoreAdmin, deleteStoreCustomer);

router.get('/:slug/drivers', adminLimiter, requireStoreAdmin, getStoreDrivers);
router.post('/:slug/drivers', adminLimiter, requireStoreAdmin, createStoreDriver);
router.put('/:slug/drivers/:id', adminLimiter, requireStoreAdmin, updateStoreDriver);
router.delete('/:slug/drivers/:id', adminLimiter, requireStoreAdmin, deleteStoreDriver);

module.exports = router;
