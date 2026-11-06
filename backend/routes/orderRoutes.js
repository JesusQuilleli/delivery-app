const express = require('express');
const router = express.Router();
const { placeOrder, updateOrderStatus, deleteOrder, getMyOrders, getMyAddresses, rateOrder, getOrderById, cancelOrderClient, batchUpdateStatus, markOrderViewed, reviewPrescription } = require('../controllers/orderController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const { orderLimiter, adminLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const { placeOrderSchema, updateOrderStatusSchema, batchStatusSchema, prescriptionReviewSchema } = require('../validations/orderValidation');

router.get('/my-orders', requireAuth, getMyOrders);
router.get('/my-addresses', requireAuth, getMyAddresses);
router.post('/place', requireAuth, orderLimiter, validate(placeOrderSchema), placeOrder);
router.put('/batch-status', requireAdmin, adminLimiter, validate(batchStatusSchema), batchUpdateStatus);
router.put('/:id/status', requireAdmin, adminLimiter, validate(updateOrderStatusSchema), updateOrderStatus);
router.put('/:id/prescription-review', requireAdmin, adminLimiter, validate(prescriptionReviewSchema), reviewPrescription);
router.put('/:id/cancel', requireAuth, cancelOrderClient);
router.put('/:id/rate', requireAuth, rateOrder);
router.put('/:id/viewed', requireAdmin, adminLimiter, markOrderViewed);
router.delete('/:id', requireAdmin, adminLimiter, deleteOrder);
router.get('/:id', requireAdmin, adminLimiter, getOrderById);

module.exports = router;
