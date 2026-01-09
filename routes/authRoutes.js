const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// GET login page
router.get('/login', (req, res) => {
  res.render('pages/login', {
    title: 'Login - Favour Furniture'
  });
});

// POST login form
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.render('pages/login', {
        title: 'Login - Favour Furniture',
        error: 'Please provide both email and password'
      });
    }

    // Find user
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.render('pages/login', {
        title: 'Login - Favour Furniture',
        error: 'Invalid email or password'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.render('pages/login', {
        title: 'Login - Favour Furniture',
        error: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Fixed: Use environment variable
      sameSite: 'strict', // Added for security
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // Redirect based on role
    if (user.role === 'admin') {
      return res.redirect('/admin/dashboard');
    } else {
      return res.redirect('/products');
    }

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).render('pages/500', { title: 'Server Error' });
  }
});

// GET register page
router.get('/register', (req, res) => {
  res.render('pages/register', {
    title: 'Register - Favour Furniture'
  });
});

// POST register form
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.render('pages/register', {
        title: 'Register - Favour Furniture',
        error: 'Please provide name, email, and password'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.render('pages/register', {
        title: 'Register - Favour Furniture',
        error: 'Password must be at least 6 characters long'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('pages/register', {
        title: 'Register - Favour Furniture',
        error: 'Email already registered'
      });
    }

    // Create user
    const user = new User({ name, email, password });
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Fixed: Use environment variable
      sameSite: 'strict', // Added for security
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // Redirect to products
    res.redirect('/products');

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific errors
    if (error.code === 11000) {
      return res.render('pages/register', {
        title: 'Register - Favour Furniture',
        error: 'Email already registered'
      });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.render('pages/register', {
        title: 'Register - Favour Furniture',
        error: errors.join(', ')
      });
    }
    
    res.status(500).render('pages/500', { title: 'Server Error' });
  }
});

// Logout
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

module.exports = router;