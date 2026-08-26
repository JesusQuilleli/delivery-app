const express = require('express');
const router = express.Router();
const { requireSuperAdmin } = require('../middleware/authMiddleware');
const { getStores, createStore, toggleStoreStatus } = require('../controllers/superadminController');
const { adminLimiter } = require('../middleware/rateLimiter');

router.get('/stores', adminLimiter, requireSuperAdmin, getStores);
router.post('/stores', adminLimiter, requireSuperAdmin, createStore);
router.put('/stores/:id/status', adminLimiter, requireSuperAdmin, toggleStoreStatus);

module.exports = router;
