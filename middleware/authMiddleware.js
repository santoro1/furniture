const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify token
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in cookies
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
      console.log('Token found in cookies:');
    } else {
      console.log('No token found in cookies');
    }

    // if (!token) {
    //   console.log('Access denied - no token');
    //   return res.status(401).render('pages/401', {
    //     title: 'Unauthorized'
    //   }
    
    // );
    // }

     if (!token) {
      console.log('No token found - allowing access for public route');
      req.user = null;
      return next(); // Allow access, user will be null
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token verified, user ID:', decoded.id);
      
      // Get user
      req.user = await User.findById(decoded.id);
      console.log('User loaded:', req.user.email, 'Role:', req.user.role);
      
      if (!req.user) {
        console.log('User not found in database');
        return res.status(401).render('pages/401', {
          title: 'Unauthorized'
        });
      }
      
      next();
    } catch (error) {
      console.log('Invalid token:', error.message);
      return res.status(401).render('pages/401', {
        title: 'Unauthorized'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).render('pages/500', {
      title: 'Server Error'
    });
  }
};

// Authorize specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    console.log('Authorizing roles:', roles, 'User role:', req.user.role);
    
    if (!roles.includes(req.user.role)) {
      console.log('Access denied - wrong role');
      return res.status(403).render('pages/403', {
        title: 'Access Denied'
      });
    }
    console.log('Authorization successful');
    next();
  };
};

// Set user in res.locals for templates - **CRITICAL ISSUE HERE**
exports.setUser = async (req, res, next) => {
  try {
    // Clear previous user data
    res.locals.user = null;
    
    if (req.cookies && req.cookies.token) {
      try {
        const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET || 'fallback-secret');
        const user = await User.findById(decoded.id).select('-password');
        
        if (user) {
          res.locals.user = user;
          console.log('User set in locals:', user.email);
        } else {
          console.log('User not found for token');
          // Clear invalid token
          res.clearCookie('token');
        }
      } catch (error) {
        console.log('Invalid token in setUser:', error.message);
        // Clear invalid token
        res.clearCookie('token');
        res.locals.user = null;
      }
    } else {
      console.log('No token cookie found');
      res.locals.user = null;
    }
    
    next();
  } catch (error) {
    console.error('setUser middleware error:', error);
    res.locals.user = null;
    next();
  }
};