const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { isAuthenticated } = require('../middleware/auth');


// POST /orders - Create new order

// router.post('/', isAuthenticated, async (req, res) => {
//   console.log('NEW ORDER ROUTE HIT - Version 2.0'); 
  
//   try {
//     const { productId, quantity, fullName, phone, city, state } = req.body;

//     const product = await Product.findById(productId);
//     if (!product) {
//       return res.status(404).json({ success: false, message: 'Product not found' });
//     }

//     const itemQuantity = parseInt(quantity || 1);
//     const subtotal = product.price * itemQuantity;
//     const totalAmount = subtotal + 2000;
//     const cleanPhone = phone ? phone.replace(/\D/g, '') : '08000000000';

//     const order = new Order({
//       user: req.user._id,
//       items: [{
//         product: productId,
//         quantity: itemQuantity,
//         price: product.price,
//         name: product.name,
//         image: product.image || 'no-image.jpg'
//       }],
//       shippingAddress: {
//         fullName: fullName || 'Customer',
//         phone: cleanPhone,
//         city: city || 'Lagos',
//         state: state || 'Lagos',
//         country: 'Nigeria'
//       },
//       paymentMethod: 'pay_on_delivery',
//       shippingFee: 2000,
//       subtotal: subtotal,
//       totalAmount: totalAmount
//     });

//     const savedOrder = await order.save();
//     const orderNumber = savedOrder.orderNumber;

//     // FORCE THE CORRECT RESPONSE FORMAT
//     const responseData = {
//       success: true,
//       message: 'Order placed successfully',
//       order: {
//         _id: savedOrder._id,
//         orderNumber: orderNumber,
//         totalAmount: savedOrder.totalAmount,
//         createdAt: savedOrder.createdAt
//       }
//     };

//     console.log('Sending response:', JSON.stringify(responseData, null, 2));
    
//     res.json(responseData);

//   } catch (error) {
//     console.error('❌ ORDER ERROR:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error: ' + error.message
//     });
//   }
// });

// routes/orders.js
// router.post('/', isAuthenticated, async (req, res) => {
//   console.log('NEW ORDER ROUTE HIT - Version 2.0');

//   try {
//     const { productId, quantity, fullName, phone, city, state } = req.body;

//     const product = await Product.findById(productId);
//     if (!product) {
//       return res.status(404).json({ success: false, message: 'Product not found' });
//     }

//     const itemQuantity = parseInt(quantity || 1, 10);
//     const subtotal = product.price * itemQuantity;
//     const shippingFee = 2000;
//     const totalAmount = subtotal + shippingFee;
//     const cleanPhone = phone ? phone.replace(/\D/g, '') : '08000000000';

//     const order = new Order({
//       user: req.user._id,
//       items: [{
//         product: productId,
//         quantity: itemQuantity,
//         price: product.price,
//         name: product.name,
//         image: product.image || 'no-image.jpg'
//       }],
//       shippingAddress: {
//         fullName: fullName || 'Customer',
//         phone: cleanPhone,
//         city: city || 'Lagos',
//         state: state || 'Lagos',
//         country: 'Nigeria'
//       },
//       paymentMethod: 'pay_on_delivery',
//       shippingFee: shippingFee,
//       subtotal: subtotal,
//       totalAmount: totalAmount
//     });

//     const savedOrder = await order.save();

//     // Build a stable "order" object for the client
//     const responseData = {
//       success: true,
//       message: `Order placed successfully! Your order number is ${savedOrder.orderNumber}`,
//       order: {
//         _id: savedOrder._id,
//         orderNumber: savedOrder.orderNumber,
//         totalAmount: savedOrder.totalAmount,
//         createdAt: savedOrder.createdAt
//       }
//     };

//     console.log('Sending response:', JSON.stringify(responseData, null, 2));
//     res.set('Content-Type', 'application/json; charset=utf-8');
//     return res.json(responseData);

//   } catch (error) {
//     console.error('ORDER ERROR:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error: ' + error.message
//     });
//   }
// });

router.post('/', isAuthenticated, async (req, res) => {
  console.log('✅ ORDER ROUTE HIT - SIMPLIFIED VERSION');
  
  try {
    const { productId, quantity, fullName, phone, city, state } = req.body;

    // Validate required fields
    if (!productId || !quantity || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product ID, quantity, and phone number are required' 
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const itemQuantity = parseInt(quantity || 1);
    const subtotal = product.price * itemQuantity;
    const shippingFee = 2000;
    const totalAmount = subtotal + shippingFee;
    const cleanPhone = phone.replace(/\D/g, '') || '08000000000';

    const order = new Order({
      user: req.user._id,
      items: [{
        product: productId,
        quantity: itemQuantity,
        price: product.price,
        name: product.name,
        image: product.image || 'no-image.jpg'
      }],
      shippingAddress: {
        fullName: fullName || 'Customer',
        phone: cleanPhone,
        city: city || 'Lagos',
        state: state || 'Lagos',
        country: 'Nigeria'
      },
      paymentMethod: 'pay_on_delivery',
      shippingFee: shippingFee,
      subtotal: subtotal,
      totalAmount: totalAmount
    });

    const savedOrder = await order.save();

    //RESPONSE success and message
    res.json({
      success: true,
      message: `Order #${savedOrder.orderNumber} placed successfully! We'll contact you on ${cleanPhone} for delivery.`
    });

  } catch (error) {
    console.error('ORDER ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Order failed. Please try again or contact support.'
    });
  }
});

// GET /orders - Get user's orders
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.product', 'name image')
      .sort({ createdAt: -1 });

    res.render('pages/orders', {
      title: 'My Orders',
      user: req.user,
      orders
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).render('pages/error', {
      title: 'Error',
      user: req.user,
      error: 'Failed to load orders'
    });
  }
});

// GET /admin/orders - Admin view all orders
router.get('/admin/orders', isAuthenticated, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).redirect('/');
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || 'all';
    
    const skip = (page - 1) * limit;

    // Build query
    const query = status !== 'all' ? { orderStatus: status } : {};

    // Get orders with pagination
    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limit);

    // Get order stats
    const stats = await Order.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ['$orderStatus', 'pending'] }, 1, 0] }
          },
          processing: {
            $sum: { $cond: [{ $eq: ['$orderStatus', 'processing'] }, 1, 0] }
          },
          shipped: {
            $sum: { $cond: [{ $eq: ['$orderStatus', 'shipped'] }, 1, 0] }
          },
          delivered: {
            $sum: { $cond: [{ $eq: ['$orderStatus', 'delivered'] }, 1, 0] }
          }
        }
      }
    ]);

    res.render('pages/admin/order', {
      title: 'Manage Orders',
      user: req.user,
      orders,
      stats: stats[0] || { total: 0, pending: 0, processing: 0, shipped: 0, delivered: 0 },
      currentFilter: status,
      currentPage: page,
      totalPages,
      limit
    });

  } catch (error) {
    console.error('Error fetching admin orders:', error);
    res.status(500).render('pages/admin/order', {
      title: 'Manage Orders',
      user: req.user,
      orders: [],
      stats: { total: 0, pending: 0, processing: 0, shipped: 0, delivered: 0 },
      currentFilter: 'all',
      currentPage: 1,
      totalPages: 1,
      limit: 10,
      error: 'Failed to load orders'
    });
  }
});

// PUT /admin/orders/:id/status - Update order status
router.put('/admin/orders/:id/status', isAuthenticated, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { status, paymentStatus, trackingNumber } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Update order
    if (status) order.orderStatus = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (trackingNumber) order.trackingNumber = trackingNumber;

    // Set delivered date if status is delivered
    if (status === 'delivered' && !order.deliveredAt) {
      order.deliveredAt = new Date();
    }

    // Set cancelled date if status is cancelled
    if (status === 'cancelled' && !order.cancelledAt) {
      order.cancelledAt = new Date();
    }

    await order.save();

    res.json({
      success: true,
      message: 'Order status updated successfully'
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message
    });
  }
});

// GET /admin/orders/:id - Get single order details
router.get('/admin/orders/:id', isAuthenticated, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('items.product', 'name image description');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Return JSON for AJAX requests
    if (req.xhr || req.headers.accept.includes('json')) {
      return res.json(order);
    }

    // Render order details page
    res.render('pages/admin/order-detail', {
      title: `Order #${order.orderNumber}`,
      user: req.user,
      order
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order details',
      error: error.message
    });
  }
});

module.exports = router;