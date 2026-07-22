const express = require('express');
const router = express.Router();
const { requireSuperAdmin } = require('../middleware/authMiddleware');
const { getStores, createStore, toggleStoreStatus } = require('../controllers/superadminController');

router.get('/stores', requireSuperAdmin, getStores);
router.post('/stores', requireSuperAdmin, createStore);
router.put('/stores/:id/status', requireSuperAdmin, toggleStoreStatus);

module.exports = router;
