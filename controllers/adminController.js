const Product = require('../models/Product');
const Order = require('../models/order');
const User = require('../models/User');

// @desc    Render admin dashboard
// @route   GET /admin/dashboard
// @access  Private/Admin
exports.getDashboard = async (req, res) => {
  try {
    // Get statistics
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const mostLikedProducts = await Product.find().sort({ likes: -1 }).limit(5);
    
    // Get recent products for history
    const recentProducts = await Product.find().sort({ updatedAt: -1 }).limit(10);
    
    res.render('pages/admin/dashboard', {
      title: 'Admin Dashboard',
      user: req.user,
      stats: {
        totalProducts,
        totalOrders,
        totalCustomers
      },
      mostLikedProducts,
      recentProducts
      // REMOVED layout parameter
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).render('pages/500', { 
      title: 'Server Error'
    });
  }
};

// @desc    Render products management page
// @route   GET /admin/products
// @access  Private/Admin
exports.getAdminProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    
    res.render('pages/admin/products', {
      title: 'Manage Products',
      products: products
      // REMOVED layout parameter
    });
  } catch (error) {
    console.error('Admin products error:', error);
    res.status(500).render('pages/500', { 
      title: 'Server Error'
    });
  }
};

// @desc    Render add product form
// @route   GET /admin/products/add
// @access  Private/Admin
exports.getAddProductForm = (req, res) => {
  res.render('pages/admin/add-product', {
    title: 'Add New Product'
    // REMOVED layout parameter
  });
};

/**
 * @desc    Get all orders for admin
 * @route   GET /admin/orders
 * @access  Private/Admin
 */
/**
 * @desc    Get all orders for admin
 * @route   GET /admin/orders
 * @access  Private/Admin
 */
exports.getAdminOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    console.log('Fetching admin orders...');
    
    // Build filter
    const filter = {};
    if (status && status !== 'all') {
      filter.orderStatus = status;
    }

    // Count total orders
    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / limit);
    const skip = (page - 1) * limit;

    // Get orders with pagination
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name email')
      .populate('items.product', 'name image price');

    console.log(`Found ${orders.length} orders`);

    // Calculate order stats
    const stats = {
      total: await Order.countDocuments({}),
      pending: await Order.countDocuments({ orderStatus: 'pending' }),
      processing: await Order.countDocuments({ orderStatus: 'processing' }),
      shipped: await Order.countDocuments({ orderStatus: 'shipped' }),
      delivered: await Order.countDocuments({ orderStatus: 'delivered' }),
      cancelled: await Order.countDocuments({ orderStatus: 'cancelled' })
    };

    // Render the admin orders page
    res.render('pages/admin/orders', {
      title: 'Manage Orders - Admin',
      user: req.user,
      orders: orders,
      stats: stats,
      currentFilter: status || 'all',
      currentPage: parseInt(page),
      totalPages: totalPages,
      limit: parseInt(limit)
    });
    
  } catch (error) {
    console.error('Get admin orders error:', error);
    req.flash('error', 'Error loading orders: ' + error.message);
    res.redirect('/admin/dashboard');
  }
};

/**
 * @desc    Get order details for admin
 * @route   GET /admin/orders/:id
 * @access  Private/Admin
 */
exports.getAdminOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('items.product', 'name image price type description');

    if (!order) {
      req.flash('error', 'Order not found');
      return res.redirect('/admin/orders');
    }

    res.render('pages/admin/order-details', {
      title: `Order ${order.orderNumber} - Admin`,
      user: req.user,
      order
    });
  } catch (error) {
    console.error('Get admin order details error:', error);
    req.flash('error', 'Error loading order details');
    res.redirect('/admin/orders');
  }
};

/**
 * @desc    Update order status
 * @route   PUT /admin/orders/:id/status
 * @access  Private/Admin
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, trackingNumber } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Update order status
    order.orderStatus = status;
    
    // Add tracking number if provided
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }

    // Set deliveredAt if status is delivered
    if (status === 'delivered' && !order.deliveredAt) {
      order.deliveredAt = new Date();
      order.paymentStatus = 'paid'; // Auto mark as paid on delivery
    }

    await order.save();

    res.json({ 
      success: true, 
      message: `Order status updated to ${status}`,
      order: order 
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating order status' 
    });
  }
};

/**
 * @desc    Update payment status
 * @route   PUT /admin/orders/:id/payment
 * @access  Private/Admin
 */
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.paymentStatus = paymentStatus;
    await order.save();

    res.json({ 
      success: true, 
      message: `Payment status updated to ${paymentStatus}`,
      order: order 
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating payment status' 
    });
  }
};

/**
 * @desc    Delete order
 * @route   DELETE /admin/orders/:id
 * @access  Private/Admin
 */
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Only allow deletion of cancelled orders or with admin override
    if (order.orderStatus !== 'cancelled' && !req.body.force) {
      return res.status(400).json({ 
        success: false, 
        message: 'Only cancelled orders can be deleted. Use force=true to override.' 
      });
    }

    await order.deleteOne();

    res.json({ 
      success: true, 
      message: 'Order deleted successfully' 
    });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting order' 
    });
  }
};

// @desc    Render edit product form
// @route   GET /admin/products/edit/:id
// @access  Private/Admin
exports.getEditProductForm = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).render('pages/404', {
        title: 'Product Not Found'
      });
    }
    
    res.render('pages/admin/edit-product', {
      title: 'Edit Product',
      product: product
      // REMOVED layout parameter
    });
  } catch (error) {
    console.error('Edit product form error:', error);
    res.status(500).render('pages/500', { 
      title: 'Server Error'
    });
  }
};