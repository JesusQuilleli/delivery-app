const express = require('express');
const router = express.Router();
const { getStoreProducts, getStoreOrders, getStoreHistory, getStoreProductDetails, updateStoreSettings, getStoreAnalytics } = require('../controllers/storeController');
const { requireAdmin } = require('../middleware/authMiddleware');

router.get('/:slug/products', getStoreProducts); // Public
router.get('/:slug/products/:productId', getStoreProductDetails); // Public
router.get('/:slug/orders', requireAdmin, getStoreOrders);
router.get('/:slug/history', requireAdmin, getStoreHistory);
router.get('/:slug/analytics', requireAdmin, getStoreAnalytics);
router.put('/:slug/settings', requireAdmin, updateStoreSettings);

module.exports = router;
