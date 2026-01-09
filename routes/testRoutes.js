const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Test database connection and data
router.get('/debug/products', async (req, res) => {
  try {
    console.log('=== DEBUG: Testing Product Query ===');
    const products = await Product.find().limit(2);
    console.log('Products found:', products.length);
    console.log('First product:', products[0] || 'none');
    
    res.json({
      success: true,
      count: products.length,
      products: products
    });
  } catch (error) {
    console.error('DEBUG ERROR:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;