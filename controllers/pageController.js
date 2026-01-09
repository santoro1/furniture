// Import the Product model - CRITICAL: Verify this path matches your structure
const Product = require('../models/Product'); // Make sure this path is correct

/**
 * @desc    Render about page
 * @route   GET /about
 * @access  Public
 */
exports.getAboutPage = (req, res) => {
  res.render('pages/about', {
    title: 'About Us - Favour Furniture',
    user: res.locals.user || null
  });
};

/**
 * @desc    Render contact page
 * @route   GET /contact
 * @access  Public
 */
exports.getContactPage = (req, res) => {
  res.render('pages/contact', {
    title: 'Contact Us - Favour Furniture',
    user: res.locals.user || null
  });
};

/**
 * @desc    Handle contact form submission
 * @route   POST /contact
 * @access  Public
 */
exports.submitContactForm = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    
    // Here you would:
    // 1. Save to database
    // 2. Send email notification
    // 3. Send auto-reply to user
    
    console.log('Contact form submitted:', { name, email, phone, subject, message });
    
    // For now, just show success message
    req.flash('success', 'Thank you for your message! We will contact you within 24 hours.');
    res.redirect('/contact');
  } catch (error) {
    console.error('Contact form error:', error);
    req.flash('error', 'Failed to send message. Please try again.');
    res.redirect('/contact');
  }
};

/**
 * @desc    Render products page with all products
 * @route   GET /products
 * @access  Public
 */
exports.getProductsPage = async (req, res) => {
  console.log('🟢 GET /products - Controller reached');
  
  try {
    console.log('1. Checking database connection...');
    
    // Test database connection first
    const productCount = await Product.countDocuments();
    console.log('2. Database connection OK. Total products:', productCount);
    
    // Get all products sorted by newest first
    const products = await Product.find().sort({ createdAt: -1 });
    console.log('3. Products fetched:', products.length);
    
    // Check user session data
    console.log('4. User data:', res.locals.user);
    
    // Check if view file exists (implicitly)
    console.log('5. Attempting to render view...');
    
    // Render the products page
    res.render('pages/products', {
      title: 'All Products - Favour Furniture',
      products: products,
      user: res.locals.user || null // Ensure user is never undefined
    });
    
    console.log('6. Render call completed successfully');
    
  } catch (error) {
    // Detailed error logging for debugging
    console.error('❌ ERROR DETAILS:');
    console.error('Message:', error.message);
    console.error('Name:', error.name);
    console.error('Stack:', error.stack);
    
    // More specific error handling
    if (error.name === 'CastError') {
      return res.status(500).send('Database Cast Error - Check your data types');
    }
    if (error.name === 'ValidationError') {
      return res.status(500).send('Database Validation Error - Check your data');
    }
    if (error.message.includes('failed to connect')) {
      return res.status(500).send('Database Connection Failed');
    }
    if (error.message.includes('view')) {
      return res.status(500).send('View Template Error - Check your EJS file');
    }
    
    // Generic error response
    res.status(500).send(`
      <h1>Server Error</h1>
      <p><strong>Error:</strong> ${error.message}</p>
      <p><strong>Type:</strong> ${error.name}</p>
      <hr>
      <h3>What to check:</h3>
      <ul>
        <li>Is MongoDB running? Check: net start MongoDB</li>
        <li>Is the Product model imported correctly?</li>
        <li>Does the view file exist at: views/pages/products.ejs?</li>
        <li>Check your database connection string in .env</li>
      </ul>
    `);
  }
};

/**
 * @desc    Test route for debugging - renders products without DB query
 * @route   GET /products/test
 * @access  Public
 */
exports.testProductsPage = async (req, res) => {
  try {
    // Create test data to verify view rendering works
    const testProducts = [
      { _id: '1', name: 'Test Product 1', price: 10000, type: 'Chair', image: 'no-image.jpg', likes: 0 },
      { _id: '2', name: 'Test Product 2', price: 20000, type: 'Table', image: 'no-image.jpg', likes: 0 }
    ];
    
    res.render('pages/products', {
      title: 'Test Products',
      products: testProducts,
      user: null
    });
  } catch (error) {
    console.error('Test page error:', error);
    res.status(500).send('Test failed: ' + error.message);
  }
};

/**
 * @desc    Render single product detail page
 * @route   GET /products/:id
 * @access  Public
 */
exports.getProductDetailPage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).render('pages/404', {
        title: 'Product Not Found'
      });
    }
    
    res.render('pages/product-detail', {
      title: `${product.name} - Favour Furniture`,
      product: product,
      user: res.locals.user || null // Ensure user is defined
    });
  } catch (error) {
    console.error('Product detail error:', error);
    res.status(500).render('pages/500', { 
      title: 'Server Error'
    });
  }
};

exports.debugProducts = async (req, res) => {
  try {
    console.log('=== DEBUG MODE ===');
    
    // Test database connection
    const mongoose = require('mongoose');
    console.log('Mongoose connection state:', mongoose.connection.readyState);
    
    // Test Product model
    const Product = require('../models/Product');
    console.log('Product model loaded:', !!Product);
    
    // Test simple query
    const count = await Product.countDocuments();
    console.log('Total products in DB:', count);
    
    // Test user in locals
    console.log('User in res.locals:', res.locals.user);
    
    // Send simple response
    res.send(`
      <h1>Debug Information</h1>
      <p>Database State: ${mongoose.connection.readyState}</p>
      <p>Total Products: ${count}</p>
      <p>User: ${res.locals.user ? res.locals.user.email : 'No user'}</p>
      <p>Product Model: ${Product ? 'Loaded' : 'NOT LOADED'}</p>
    `);
    
  } catch (error) {
    console.error('DEBUG ERROR:', error);
    res.status(500).send(`
      <h1>Debug Error</h1>
      <p>${error.message}</p>
      <pre>${error.stack}</pre>
    `);
  }
};

exports.checkTemplate = (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  try {
    const templatePath = path.join(__dirname, '../views/pages/products.ejs');
    const content = fs.readFileSync(templatePath, 'utf8');
    
    res.send(`
      <h1>Template Content Check</h1>
      <h3>First 10 lines:</h3>
      <pre>${content.split('\n').slice(0, 10).join('\n')}</pre>
      <h3>File exists: ${fs.existsSync(templatePath)}</h3>
      <h3>File path: ${templatePath}</h3>
    `);
  } catch (error) {
    res.send(`Error reading file: ${error.message}`);
  }
};

/**
 * @desc    Render home page with 6 most recent products
 * @route   GET /
 * @access  Public
 */
exports.getHomePage = async (req, res) => {
  try {
    // Fetch 6 most recent products
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(); // .lean() makes queries faster by returning plain JS objects
    
    res.render('pages/home', {
      title: 'Favour Furniture - Premium Quality Furniture',
      products: products
      // Layout parameter removed - using standalone pages
    });
  } catch (error) {
    console.error('Error loading home page:', error);
    res.status(500).render('pages/500', { 
      title: 'Error'
    });
  }
};