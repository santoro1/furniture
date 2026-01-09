const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Cookie parser (must come before session)
app.use(cookieParser());

// Session middleware (required for flash)
app.use(session({
  secret: process.env.JWT_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false
  }
}));

// Flash messages middleware
app.use(flash());

// CORS middleware
app.use(cors({
  origin: 'http://localhost:5000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Method override for PUT/DELETE from forms
app.use(methodOverride('_method'));

// Set current page for navigation
app.use((req, res, next) => {
  const currentPath = req.path;
  
  if (currentPath === '/') {
    res.locals.currentPage = 'home';
  } else if (currentPath.startsWith('/products')) {
    res.locals.currentPage = 'products';
  } else if (currentPath.startsWith('/orders')) {
    res.locals.currentPage = 'orders';
  } else if (currentPath.startsWith('/about')) {
    res.locals.currentPage = 'about';
  } else if (currentPath.startsWith('/contact')) {
    res.locals.currentPage = 'contact';
  } else if (currentPath.startsWith('/auth/login')) {
    res.locals.currentPage = 'login';
  } else if (currentPath.startsWith('/auth/register')) {
    res.locals.currentPage = 'register';
  } else if (currentPath.startsWith('/checkout')) {
    res.locals.currentPage = 'checkout';
  } else if (currentPath.startsWith('/admin')) {
    res.locals.currentPage = 'admin';
  } else {
    res.locals.currentPage = '';
  }
  next();
});

// USER MIDDLEWARE
const { setUser } = require('./middleware/authMiddleware');
app.use(setUser);

// Make flash/data available to ALL templates
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// Static folder setup
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// EJS configuration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Import routes
const pageRoutes = require('./routes/pageRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const orderRoutes = require('./routes/orderRoutes'); // Add this import

// Use routes
app.use('/', pageRoutes);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/', orderRoutes); // Add order routes



// TEST ROUTES


// Test order route
app.post('/test-order', async (req, res) => {
  try {
    console.log('Test order received:', req.body);
    
    res.json({ 
      success: true, 
      message: 'Test order successful',
      data: req.body 
    });
  } catch (error) {
    console.error('Test order error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Check user phone
app.get('/check-user-phone', async (req, res) => {
  if (!req.user) {
    return res.redirect('/auth/login');
  }
  
  try {
    const User = require('./models/User');
    const user = await User.findById(req.user._id);
    
    res.send(`
      <h1>User Phone Check</h1>
      <p><strong>User ID:</strong> ${user._id}</p>
      <p><strong>Name:</strong> ${user.name}</p>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Phone:</strong> ${user.phone || '❌ NOT SET'}</p>
      <p><strong>Has Phone Field:</strong> ${'phone' in user ? '✅ Yes' : '❌ No'}</p>
      <p><strong>Phone Type:</strong> ${typeof user.phone}</p>
      
      <hr>
      <h3>Update Phone</h3>
      <form action="/update-phone" method="POST">
        <input type="tel" name="phone" placeholder="08012345678" required>
        <button type="submit">Update Phone</button>
      </form>
    `);
  } catch (error) {
    res.send(`Error: ${error.message}`);
  }
});

// Update phone
app.post('/update-phone', async (req, res) => {
  if (!req.user) {
    return res.redirect('/auth/login');
  }
  
  try {
    const User = require('./models/User');
    await User.findByIdAndUpdate(req.user._id, {
      phone: req.body.phone
    });
    
    res.send(`
      <h1>Phone Updated</h1>
      <p>Your phone has been set to: ${req.body.phone}</p>
      <p><a href="/check-user-phone">Check Again</a></p>
      <p><a href="/products">Browse Products</a></p>
    `);
  } catch (error) {
    res.send(`Error: ${error.message}`);
  }
});

// Fix all users phone
app.get('/fix-users-phone', async (req, res) => {
  try {
    const User = require('./models/User');
    
    const usersWithoutPhone = await User.find({ 
      $or: [
        { phone: { $exists: false } },
        { phone: { $eq: null } },
        { phone: { $eq: '' } }
      ]
    });
    
    let updatedCount = 0;
    
    for (const user of usersWithoutPhone) {
      await User.findByIdAndUpdate(user._id, {
        phone: user.email.includes('admin') ? '08012345678' : '08000000000'
      });
      updatedCount++;
    }
    
    res.send(`
      <h1>Users Phone Fix</h1>
      <p>Found ${usersWithoutPhone.length} users without phone</p>
      <p>Updated ${updatedCount} users with default phone numbers</p>
      <p><a href="/check-user-phone">Check Your Phone</a></p>
    `);
  } catch (error) {
    res.send(`Error: ${error.message}`);
  }
});

// Debug orders
app.get('/debug-orders', async (req, res) => {
  try {
    const Order = require('./models/order');
    const orders = await Order.find();
    
    res.json({
      totalOrders: orders.length,
      orders: orders.map(o => ({
        id: o._id,
        orderNumber: o.orderNumber,
        user: o.user,
        buyerPhone: o.buyerInfo?.phone,
        sellerPhone: o.sellerInfo?.phone,
        total: o.totalAmount,
        status: o.orderStatus,
        createdAt: o.createdAt
      }))
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});


// ERROR HANDLERS


// 404 Page Not Found
app.use((req, res) => {
  res.status(404).render('pages/404', { 
    title: 'Page Not Found'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('GLOBAL ERROR:', err.stack);
  res.status(500).render('pages/500', { 
    title: 'Server Error'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Access: http://localhost:${PORT}`);
});