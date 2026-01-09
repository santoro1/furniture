
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

// Import controllers - FIXED: Add missing import
const adminController = require('../controllers/adminController');
const productController = require('../controllers/productController');

// Debug middleware
router.use((req, res, next) => {
  console.log('Admin route accessed:', req.path);
  console.log('User:', req.user ? req.user.email : 'No user');
  console.log('Role:', req.user ? req.user.role : 'No role');
  next();
});

// Protect all admin routes
router.use(protect, authorize('admin'));

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Product Management
router.get('/products', adminController.getAdminProducts);
router.get('/products/add', adminController.getAddProductForm);
router.post('/products', upload.single('image'), productController.createProduct);
router.get('/products/edit/:id', adminController.getEditProductForm);
router.put('/products/:id', upload.single('image'), productController.updateProduct);
router.delete('/products/:id', productController.deleteProduct);

// Order routes - FIXED: Use imported adminController
router.get('/orders', adminController.getAdminOrders);
router.get('/orders/:id', adminController.getAdminOrderDetails);
router.put('/orders/:id/status', adminController.updateOrderStatus);
router.put('/orders/:id/payment', adminController.updatePaymentStatus);
router.delete('/orders/:id', adminController.deleteOrder);

module.exports = router;