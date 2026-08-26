const express = require('express');
const router = express.Router();
const { placeOrder, updateOrderStatus, deleteOrder, getMyOrders, rateOrder, getOrderById, cancelOrderClient, batchUpdateStatus, markOrderViewed } = require('../controllers/orderController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const { orderLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const { placeOrderSchema, updateOrderStatusSchema, batchStatusSchema } = require('../validations/orderValidation');

router.get('/my-orders', requireAuth, getMyOrders);
router.post('/place', requireAuth, orderLimiter, validate(placeOrderSchema), placeOrder);
router.put('/batch-status', requireAdmin, validate(batchStatusSchema), batchUpdateStatus);
router.put('/:id/status', requireAdmin, validate(updateOrderStatusSchema), updateOrderStatus);
router.put('/:id/cancel', requireAuth, cancelOrderClient);
router.put('/:id/rate', requireAuth, rateOrder);
router.put('/:id/viewed', requireAdmin, markOrderViewed);
router.delete('/:id', requireAdmin, deleteOrder);
router.get('/:id', requireAdmin, getOrderById);

module.exports = router;
