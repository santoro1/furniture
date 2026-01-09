const Order = require('../models/order');
const Product = require('../models/Product');

/**
 * @desc    Get user's orders
 * @route   GET /orders
 * @access  Private
 */
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('items.product', 'name image price');

    res.render('pages/orders', {
      title: 'My Orders - Favour Furniture',
      user: req.user,
      orders,
      currentPage: 'orders'
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    req.flash('error', 'Error loading your orders');
    res.redirect('/');
  }
};

/**
 * @desc    Get single order details
 * @route   GET /orders/:id
 * @access  Private
 */
exports.getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name image price type')
      .populate('user', 'name email phone');

    if (!order) {
      req.flash('error', 'Order not found');
      return res.redirect('/orders');
    }

    // Check if user owns the order or is admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      req.flash('error', 'Access denied');
      return res.redirect('/orders');
    }

    res.render('pages/order-details', {
      title: `Order ${order.orderNumber} - Details`,
      user: req.user,
      order
    });
  } catch (error) {
    console.error('Get order details error:', error);
    req.flash('error', 'Error loading order details');
    res.redirect('/orders');
  }
};

/**
 * @desc    Create new order
 * @route   POST /orders
 * @access  Private
 */
exports.createOrder = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    // Get product details
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // Calculate totals
    const subtotal = product.price * parseInt(quantity);
    const shippingFee = 2000;
    const totalAmount = subtotal + shippingFee;

    // Create order with proper values
    const order = new Order({
      user: req.user._id,
      items: [{
        product: product._id,
        quantity: parseInt(quantity),
        price: product.price,
        name: product.name,
        image: product.image || 'no-image.jpg'
      }],
      shippingAddress: {
        fullName: req.user.name || 'Customer',
        phone: req.user.phone || '08000000000',
        address: req.user.address || 'Address to be confirmed',
        city: req.user.city || 'Lagos',
        state: req.user.state || 'Lagos',
        postalCode: req.user.postalCode || '100001',
        country: 'Nigeria'
      },
      paymentMethod: 'pay_on_delivery',
      paymentStatus: 'pending',
      orderStatus: 'pending',
      shippingFee: shippingFee,
      subtotal: subtotal,
      totalAmount: totalAmount,
      orderNotes: 'Order placed from product page'
    });

    await order.save();

    res.json({ 
      success: true, 
      message: `Order placed successfully! Your order number is ${order.orderNumber}`,
      orderId: order._id,
      orderNumber: order.orderNumber
    });
    
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating order: ' + error.message 
    });
  }
};
/**
 * @desc    Cancel order
 * @route   POST /orders/:id/cancel
 * @access  Private
 */
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check if user owns the order
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Check if order can be cancelled
    if (!['pending', 'processing'].includes(order.orderStatus)) {
      return res.status(400).json({ 
        success: false, 
        message: `Order cannot be cancelled. Current status: ${order.orderStatus}` 
      });
    }

    order.orderStatus = 'cancelled';
    order.cancelledAt = new Date();
    await order.save();

    res.json({ 
      success: true, 
      message: 'Order cancelled successfully' 
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error cancelling order' 
    });
  }
};

/**
 * @desc    Checkout page
 * @route   GET /checkout
 * @access  Private
 */
exports.getCheckoutPage = async (req, res) => {
  try {
    // Get cart items from session or database
    const cartItems = req.session.cart || [];
    
    if (cartItems.length === 0) {
      req.flash('error', 'Your cart is empty');
      return res.redirect('/products');
    }

    // Calculate totals
    const subtotal = cartItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
    
    const shippingFee = 2000;
    const totalAmount = subtotal + shippingFee;

    res.render('pages/checkout', {
      title: 'Checkout - Favour Furniture',
      user: req.user,
      cartItems,
      subtotal,
      shippingFee,
      totalAmount
    });
  } catch (error) {
    console.error('Checkout page error:', error);
    req.flash('error', 'Error loading checkout page');
    res.redirect('/cart');
  }
};