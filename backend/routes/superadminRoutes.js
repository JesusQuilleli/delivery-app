const express = require('express');
const router = express.Router();
const { requireSuperAdmin } = require('../middleware/authMiddleware');
const {
  getStores,
  resetStoreAdminPassword,
  triggerSubscriptionLifecycleCheck,
  createStore,
  toggleStoreStatus,
  getSubscriptions,
  updateStoreSubscription,
  recordSubscriptionPayment,
  getStorePayments
} = require('../controllers/superadminController');
const { adminLimiter } = require('../middleware/rateLimiter');

router.get('/stores', adminLimiter, requireSuperAdmin, getStores);
router.post('/stores', adminLimiter, requireSuperAdmin, createStore);
router.put('/stores/:id/status', adminLimiter, requireSuperAdmin, toggleStoreStatus);
router.post('/stores/:id/reset-password', adminLimiter, requireSuperAdmin, resetStoreAdminPassword);

// Rutas SaaS de Suscripciones y Pagos (Fase 2B)
router.get('/subscriptions', adminLimiter, requireSuperAdmin, getSubscriptions);
router.put('/stores/:id/subscription', adminLimiter, requireSuperAdmin, updateStoreSubscription);
router.get('/stores/:id/payments', adminLimiter, requireSuperAdmin, getStorePayments);
router.post('/stores/:id/payments', adminLimiter, requireSuperAdmin, recordSubscriptionPayment);
router.post('/subscriptions/check-lifecycle', adminLimiter, requireSuperAdmin, triggerSubscriptionLifecycleCheck);

module.exports = router;
