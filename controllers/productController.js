const Product = require('../models/Product');

// @desc    Get all products (for API)
// @route   GET /api/products
// @access  Public
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res) => {
  try {
    const { name, type, price, description } = req.body;
    
    let image = 'no-image.jpg';
    if (req.file) {
      image = req.file.filename;
    }

    const product = new Product({
      name,
      type,
      price: parseFloat(price),
      description,
      image
    });

    await product.save();
    req.flash('success', 'Product created successfully');
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Create product error:', error);
    req.flash('error', 'Error creating product');
    res.redirect('/admin/products/add');
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { name, type, price, description } = req.body;
    
    product.name = name;
    product.type = type;
    product.price = parseFloat(price);
    product.description = description;

    // Update image if new one uploaded
    if (req.file) {
      product.image = req.file.filename;
    }

    await product.save();
    req.flash('success', 'Product updated successfully');
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Update product error:', error);
    req.flash('error', 'Error updating product');
    res.redirect(`/admin/products/edit/${req.params.id}`);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await Product.deleteOne({ _id: req.params.id });
    req.flash('success', 'Product deleted successfully');
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Delete product error:', error);
    req.flash('error', 'Error deleting product');
    res.redirect('/admin/products');
  }
};

// @desc    Like product (increment likes)
// @route   POST /api/products/:id/like
// @access  Public
exports.likeProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    product.likes += 1;
    await product.save();
    
    res.json({ success: true, likes: product.likes });
  } catch (error) {
    console.error('Like product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};