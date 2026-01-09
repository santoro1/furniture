const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// @desc    Login user
// @route   POST /auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('=== LOGIN ATTEMPT ===');
    console.log('Email:', email);
    console.log('Password provided:', password ? 'Yes' : 'No');

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('❌ User not found in database');
      return res.status(401).render('pages/login', {
        title: 'Login - Favour Furniture',
        error: 'Invalid email or password'
      });
    }

    console.log('✅ User found:', user.email);
    console.log('User role:', user.role);

    // Check password
    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      console.log('❌ Password incorrect');
      return res.status(401).render('pages/login', {
        title: 'Login - Favour Furniture',
        error: 'Invalid email or password'
      });
    }

    console.log('✅ LOGIN SUCCESSFUL');

    // Generate token
    const token = generateToken(user._id);
    console.log('Token generated');

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    console.log('Cookie set');

    // Redirect based on role
    if (user.role === 'admin') {
      console.log('🎯 Redirecting to /admin/dashboard');
      return res.redirect('/admin/dashboard');
    } else {
      console.log('🎯 Redirecting to /products');
      return res.redirect('/products');
    }

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).render('pages/500', { 
      title: 'Server Error'
    });
  }
};

// @desc    Register new user
// @route   POST /auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).render('pages/register', {
        title: 'Register - Favour Furniture',
        error: 'Email already registered'
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      phone,
      address
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // Redirect to products
    res.redirect('/products');

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).render('pages/500', { 
      title: 'Server Error'
    });
  }
};

// @desc    Logout user
// @route   GET /auth/logout
// @access  Private
exports.logout = (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
};