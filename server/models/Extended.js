const mongoose = require('mongoose');

// ─── Review Schema ────────────────────────────────────────────────────────────
const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, required: true, trim: true },
  comment: { type: String, trim: true },
  verified: { type: Boolean, default: false },
  helpful: { type: Number, default: 0 },
  unhelpful: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: String,
  images: [String],
}, { timestamps: true });

reviewSchema.index({ product: 1, status: 1 });

const Review = mongoose.model('Review', reviewSchema);

// ─── Activity Log Schema ──────────────────────────────────────────────────────
const activityLogSchema = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true }, // create, update, delete, export, etc
  entity: { type: String, required: true }, // product, user, order, etc
  entityId: { type: String, required: true },
  changes: { before: Object, after: Object },
  ip: String,
  userAgent: String,
  status: { type: String, enum: ['success', 'failed'], default: 'success' },
  errorMessage: String,
}, { timestamps: true });

activityLogSchema.index({ admin: 1, createdAt: -1 });
activityLogSchema.index({ entity: 1, createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

// ─── Store Settings Schema ────────────────────────────────────────────────────
const settingsSchema = new mongoose.Schema({
  storeName: { type: String, default: 'LuxeStore' },
  storeDescription: String,
  logo: String,
  favicon: String,
  email: { type: String, required: true },
  phone: String,
  address: String,
  city: String,
  state: String,
  pincode: String,
  country: { type: String, default: 'India' },
  gstin: String,
  pan: String,

  // Email Settings
  emailProvider: { type: String, enum: ['smtp', 'sendgrid'], default: 'smtp' },
  smtpHost: String,
  smtpPort: Number,
  smtpUser: String,
  smtpPassword: String,

  // Stripe Settings
  stripePublicKey: String,
  stripeSecretKey: String,

  // Shipping Settings
  shippingEnabled: { type: Boolean, default: true },
  standardShippingCost: { type: Number, default: 0 },
  freeShippingThreshold: { type: Number, default: 0 },
  shippingZones: [{
    name: String,
    regions: [String],
    cost: Number,
    estimatedDays: Number,
  }],

  // Tax Settings
  taxEnabled: { type: Boolean, default: true },
  taxInclusive: { type: Boolean, default: false },
  taxRate: { type: Number, default: 0 },
  taxLabel: { type: String, default: 'GST' },
  taxClasses: [{ name: String, rate: Number }],

  commonAttributes: [{
    name: String,
    type: { type: String, default: 'text' },
    values: [String],
    swatches: [{
      value: String,
      color: String,
      image: String
    }]
  }],

  shopFilters: [{
    id: String,
    label: String,
    type: { type: String, enum: ['category', 'subCategory', 'brand', 'price', 'sale', 'attribute', 'rating'] },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
  }],

  // RMA Policies
  rmaPolicies: [{
    type: { type: String, enum: ['return', 'refund', 'cancel', 'exchange'], required: true },
    paymentMethod: { type: String, enum: ['all', 'cod', 'online', 'card', 'upi', 'netbanking'], default: 'all' },
    condition: { type: String, default: 'InCase: If' },
    parameter: { type: String, enum: ['Maximum Days', 'Order Statuses'], required: true },
    operator: { type: String, enum: ['Less than', 'Equal to', 'Greater than', 'Not equal to'], required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    active: { type: Boolean, default: true }
  }],

  // Storefront Controls
  homepageBanners: [{
    title: { type: String, default: 'EMBRACE THE ELEGANCE.' },
    subtitle: { type: String, default: 'NEW COLLECTION \'24' },
    ctaText: { type: String, default: 'DISCOVER NOW' },
    ctaLink: { type: String, default: '/shop' },
    image: { type: String, default: '/images/hero-banner.png' },
    isActive: { type: Boolean, default: true }
  }],

  testimonials: [{
    name: { type: String, required: true },
    role: { type: String, default: 'Verified Customer' },
    content: { type: String, required: true },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    image: { type: String, default: '' },
    isActive: { type: Boolean, default: true }
  }],

  // Tracking & Analytics
  metaPixelId: { type: String, default: '' },
  googleAnalyticsId: { type: String, default: '' },

  // Storefront Contact Details & Map
  contactEmail: { type: String, default: 'help@shopmeloraa.com' },
  contactPhone: { type: String, default: '+91 97799720364' },
  contactAddress: { type: String, default: 'D-64, first floor Okhla Phase 1\nNew Delhi 110020' },
  contactMapUrl: { type: String, default: 'https://maps.google.com/maps?q=D-64%2C%20first%20floor%20Okhla%20Phase%201%2CNew%20Delhi%20110020&t=&z=15&ie=UTF8&iwloc=&output=embed' },

}, { timestamps: true });

const Settings = mongoose.model('Settings', settingsSchema);

// ─── Email Template Schema ────────────────────────────────────────────────────
const emailTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  subject: { type: String, required: true },
  template: { type: String, required: true }, // HTML template
  variables: [String], // {{variable}} placeholders
  type: { type: String, enum: ['order', 'user', 'notification', 'admin'], default: 'notification' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const EmailTemplate = mongoose.model('EmailTemplate', emailTemplateSchema);

// ─── Inventory Alert Schema ───────────────────────────────────────────────────
const inventoryAlertSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  alertType: { type: String, enum: ['low_stock', 'out_of_stock'], required: true },
  threshold: { type: Number, default: 5 },
  currentStock: Number,
  notificationSent: { type: Boolean, default: false },
  resolvedAt: Date,
  resolved: { type: Boolean, default: false },
}, { timestamps: true });

const InventoryAlert = mongoose.model('InventoryAlert', inventoryAlertSchema);

module.exports = {
  Review,
  ActivityLog,
  Settings,
  EmailTemplate,
  InventoryAlert,
};
