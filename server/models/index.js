const mongoose = require('mongoose');

// ─── Category ─────────────────────────────────────────────────────────────────
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, lowercase: true },
  description: String,
  image: String,
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  level: { type: Number, default: 0 },
  attributes: [String],
  sizeChart: String, // URL to image
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

// ─── Order ────────────────────────────────────────────────────────────────────
const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  variant: String,
  quantity: { type: Number, required: true, min: 1 },
  hsnCode: String,
  taxRate: { type: Number, default: 0 },
  sku: String,
  price: { type: Number, required: true },
  total: { type: Number, required: true },
});

const addressSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  phone: String,
  email: String,
  address: String, // Added to match frontend
  addressLine1: String,
  addressLine2: String,
  city: String,
  state: String,
  pincode: String,
  zipCode: String, // Added to match frontend
  country: { type: String, default: 'India' },
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [orderItemSchema],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  shipping: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, required: true },
  shippingAddress: addressSchema,
  billingAddress: addressSchema,
  paymentMethod: { type: String, enum: ['card', 'upi', 'netbanking', 'cod'], default: 'cod' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'Refund Requested', 'refunded', 'partially-refunded'],
    default: 'pending',
  },
  returnStatus: {
    type: String,
    enum: ['none', 'requested', 'approved', 'rejected', 'completed'],
    default: 'none',
  },
  returnReason: String,
  returnDate: Date,
  refundAmount: { type: Number, default: 0 },
  totalRefunded: { type: Number, default: 0 },
  refunds: [{
    amount: { type: Number, required: true },
    reason: String,
    restocked: { type: Boolean, default: false },
    items: [{
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: Number
    }],
    createdAt: { type: Date, default: Date.now }
  }],
  trackingNumber: String,
  notes: String,
  coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
  deliveredAt: Date,
  paymentId: String,
}, { timestamps: true });

orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const year = new Date().getFullYear();
    const Counter = mongoose.model('Counter');
    const counter = await Counter.findOneAndUpdate(
      { id: 'orderNumber' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.orderNumber = `ORD-${year}-${String(counter.seq).padStart(5, '0')}`;
  }
  next();
});

// ─── Coupon ───────────────────────────────────────────────────────────────────
const couponSchema = new mongoose.Schema({
  code: { type: String, unique: true, uppercase: true },
  type: { type: String, enum: ['percentage', 'fixed'], required: true },
  value: { type: Number, required: true },
  minPurchase: { type: Number, default: 0 },
  maxDiscount: { type: Number, default: 0 },
  startDate: Date,
  endDate: Date,
  usageLimit: { type: Number, default: 0 },
  usedCount: { type: Number, default: 0 },
  perUserLimit: { type: Number, default: 1 },
  applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

couponSchema.methods.isValid = function () {
  const now = new Date();
  if (!this.isActive) return false;
  
  // Get YYYY-MM-DD from the DB dates
  const getYYYYMMDD = (d) => new Date(d).toISOString().split('T')[0];
  
  // Use a simple date string comparison to ignore time/timezone shifts for the start date
  if (this.startDate) {
    const todayStr = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)).toISOString().split('T')[0]; // Offset for IST (UTC+5:30)
    const startStr = getYYYYMMDD(this.startDate);
    
    if (todayStr < startStr) return false;
  }
  
  if (this.endDate) {
    const todayStr = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)).toISOString().split('T')[0];
    const endStr = getYYYYMMDD(this.endDate);
    
    if (todayStr > endStr) return false;
  }
  
  if (this.usageLimit > 0 && this.usedCount >= this.usageLimit) return false;
  return true;
};

couponSchema.methods.calculateDiscount = function (items = [], subtotal) {
  console.log(`Calculating discount for coupon: ${this.code}, Subtotal: ${subtotal}, Items: ${items.length}`);
  
  // If no restrictions, apply to full subtotal
  if ((!this.applicableProducts || this.applicableProducts.length === 0) && 
      (!this.applicableCategories || this.applicableCategories.length === 0)) {
    console.log('No restrictions found. Applying to full subtotal.');
    if (subtotal < this.minPurchase) {
      console.log(`Subtotal ${subtotal} is less than minPurchase ${this.minPurchase}`);
      return 0;
    }
    let discount = this.type === 'percentage' ? (subtotal * this.value) / 100 : this.value;
    if (this.maxDiscount > 0) discount = Math.min(discount, this.maxDiscount);
    console.log(`Discount calculated: ${discount}`);
    return Math.round(discount);
  }

  // Handle restrictions
  let eligibleSubtotal = 0;
  items.forEach(item => {
    const isProdMatch = this.applicableProducts.some(id => id.toString() === item.product.toString());
    const isCatMatch = item.category && this.applicableCategories.some(id => id.toString() === item.category.toString());
    
    if (isProdMatch || isCatMatch) {
      eligibleSubtotal += (item.price * item.quantity);
    }
  });

  console.log(`Eligible subtotal based on restrictions: ${eligibleSubtotal}`);
  if (eligibleSubtotal < this.minPurchase) return 0;
  
  let discount = this.type === 'percentage' 
    ? (eligibleSubtotal * this.value) / 100 
    : this.value;
    
  if (this.maxDiscount > 0) discount = Math.min(discount, this.maxDiscount);
  console.log(`Restricted discount calculated: ${discount}`);
  return Math.round(discount);
};

const counterSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', counterSchema);

const Category = mongoose.model('Category', categorySchema);
const Order = mongoose.model('Order', orderSchema);
const Coupon = mongoose.model('Coupon', couponSchema);
const Product = require('./Product');
const Return = require('./Return');

module.exports = { Category, Order, Coupon, Return, Counter, Product };
