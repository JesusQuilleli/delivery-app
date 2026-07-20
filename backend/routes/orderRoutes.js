const express = require('express');
const router = express.Router();
const { placeOrder, updateOrderStatus, deleteOrder, getMyOrders, rateOrder, getOrderById, cancelOrderClient } = require('../controllers/orderController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

router.get('/my-orders', requireAuth, getMyOrders);
router.post('/place', requireAuth, placeOrder);
router.put('/:id/status', requireAdmin, updateOrderStatus);
router.put('/:id/cancel', requireAuth, cancelOrderClient);
router.put('/:id/rate', requireAuth, rateOrder);
router.delete('/:id', requireAdmin, deleteOrder);
router.get('/:id', requireAdmin, getOrderById);

module.exports = router;
