const express = require('express');
const router = express.Router();
const { getStoreProducts, getStoreOrders, getStoreHistory, getStoreProductDetails, updateStoreSettings, getStoreAnalytics, getStoreCustomers, updateStoreCustomer, deleteStoreCustomer, getStoreDrivers, createStoreDriver, updateStoreDriver, deleteStoreDriver } = require('../controllers/storeController');
const { requireStoreAdmin } = require('../middleware/authMiddleware');

router.get('/:slug/products', getStoreProducts); // Public
router.get('/:slug/products/:productId', getStoreProductDetails); // Public
router.get('/:slug/orders', requireStoreAdmin, getStoreOrders);
router.get('/:slug/history', requireStoreAdmin, getStoreHistory);
router.get('/:slug/analytics', requireStoreAdmin, getStoreAnalytics);
router.put('/:slug/settings', requireStoreAdmin, updateStoreSettings);
router.get('/:slug/customers', requireStoreAdmin, getStoreCustomers);
router.put('/:slug/customers/:id', requireStoreAdmin, updateStoreCustomer);
router.delete('/:slug/customers/:id', requireStoreAdmin, deleteStoreCustomer);

router.get('/:slug/drivers', requireStoreAdmin, getStoreDrivers);
router.post('/:slug/drivers', requireStoreAdmin, createStoreDriver);
router.put('/:slug/drivers/:id', requireStoreAdmin, updateStoreDriver);
router.delete('/:slug/drivers/:id', requireStoreAdmin, deleteStoreDriver);

module.exports = router;
