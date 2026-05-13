const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema({
  rmaNumber: {
    type: String,
    unique: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['return', 'refund', 'exchange'],
    required: true
  },
  reason: {
    type: String,
    enum: [
      'defective', 'wrong_item', 'not_as_described',
      'size_issue', 'changed_mind', 'damaged_in_transit',
      'missing_parts', 'other'
    ],
    required: true
  },
  reasonDetails: {
    type: String,
    maxlength: 1000
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    orderItem: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    returnReason: String,
    condition: {
      type: String,
      enum: ['unopened', 'opened', 'damaged'],
      required: true
    }
  }],
  photos: [String],
  status: {
    type: String,
    enum: [
      'pending', 'approved', 'rejected', 'pickup_scheduled',
      'in_transit', 'received', 'inspecting', 'completed', 'cancelled'
    ],
    default: 'pending'
  },
  refundMethod: {
    type: String,
    enum: ['original_payment', 'store_credit', 'bank_transfer']
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  storeCredit: {
    type: Number,
    default: 0
  },
  exchangeOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  exchangeItems: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    variant: String,
    quantity: Number
  }],
  adminNotes: String,
  customerNotes: String,
  rejectionReason: String,
  timeline: [{
    status: String,
    message: String,
    date: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  pickupAddress: {
    type: Object,
    required: true
  },
  trackingNumber: String,
  returnWindow: {
    type: Number,
    default: 7
  },
  isWithinWindow: {
    type: Boolean,
    default: true
  },
  resolvedAt: Date
}, {
  timestamps: true
});

// Auto-generate rmaNumber and calculate isWithinWindow
returnSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Generate RMA number: RMA-YYYY-00001
    const date = new Date();
    const year = date.getFullYear();
    const count = await mongoose.model('Return').countDocuments({
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    });
    this.rmaNumber = `RMA-${year}-${(count + 1).toString().padStart(5, '0')}`;
    
    // Push initial timeline
    this.timeline.push({
      status: 'pending',
      message: 'Return request submitted',
      date: new Date()
    });
  }

  // Calculate isWithinWindow based on order's deliveredAt
  try {
    const Order = mongoose.model('Order');
    const order = await Order.findById(this.order);
    if (order && order.deliveredAt) {
      const deliveredDate = new Date(order.deliveredAt);
      const now = new Date();
      const diffTime = Math.abs(now - deliveredDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      this.isWithinWindow = diffDays <= this.returnWindow;
    }
  } catch (err) {
    console.error('Error calculating return window:', err);
  }

  next();
});

// Methods
returnSchema.methods.canBeCancelled = function() {
  return ['pending', 'approved'].includes(this.status);
};

returnSchema.methods.isEligible = function(deliveredAt) {
  if (!deliveredAt) return false;
  const deliveredDate = new Date(deliveredAt);
  const now = new Date();
  const diffTime = Math.abs(now - deliveredDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= this.returnWindow;
};

module.exports = mongoose.model('Return', returnSchema);
