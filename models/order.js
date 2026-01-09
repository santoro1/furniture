const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    price: {
      type: Number,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    image: {
      type: String,
      default: 'no-image.jpg'
    }
  }],
  shippingAddress: {
    fullName: {
      type: String,
      default: 'Customer'
    },
    phone: {
      type: String,
      default: '08000000000'
    },
    city: {
      type: String,
      default: 'Lagos'
    },
    state: {
      type: String,
      default: 'Lagos'
    },
    country: {
      type: String,
      default: 'Nigeria'
    }
  },
  paymentMethod: {
    type: String,
    default: 'pay_on_delivery'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  subtotal: {
    type: Number,
    default: 0
  },
  shippingFee: {
    type: Number,
    default: 2000
  },
  totalAmount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Calculate totals before saving
orderSchema.pre('save', function(next) {
  this.subtotal = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  
  this.totalAmount = this.subtotal + this.shippingFee;
  
  // Ensure phone has a value
  if (!this.shippingAddress.phone || this.shippingAddress.phone.trim() === '') {
    this.shippingAddress.phone = '08000000000';
  }
  
  next();
});

// Virtual for formatted order number
orderSchema.virtual('orderNumber').get(function() {
  return `ORD-${this._id.toString().slice(-8).toUpperCase()}`;
});

// CRITICAL: Clear any existing model to prevent caching
delete mongoose.connection.models.Order;

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;