const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

// All order routes require authentication
router.use(protect);

// User order routes
router.get('/orders', orderController.getUserOrders);
router.get('/orders/:id', orderController.getOrderDetails);
router.post('/orders', orderController.createOrder);
router.post('/orders/:id/cancel', orderController.cancelOrder);
router.get('/checkout', orderController.getCheckoutPage);

module.exports = router;