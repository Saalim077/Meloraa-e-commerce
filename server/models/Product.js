const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rating: { type: Number, min: 1, max: 5 },
  review: String,
  date: { type: Date, default: Date.now },
});

const variantSchema = new mongoose.Schema({
  name: String,
  sku: String,
  price: Number,
  comparePrice: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  images: [String],
  manageStock: { type: Boolean, default: true },
  isEnabled: { type: Boolean, default: true },
  attributes: [{ name: String, value: String }],
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, lowercase: true },
  sku: { type: String, unique: true },
  hsnCode: { type: String, default: '' },
  description: String,
  shortDescription: String,
  mainImage: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  comparePrice: { type: Number, default: 0 },
  costPrice: { type: Number, default: 0 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  brand: { type: String, default: '' },
  images: [String],
  tags: [String],
  attributes: [{
    name: String,
    value: String,
    values: [String],
    type: { type: String, default: 'text' }, // text, color, image
    swatches: [{
      value: String,
      color: String,
      image: String
    }],
    isVisible: { type: Boolean, default: true },
    isVariation: { type: Boolean, default: false }
  }],
  defaultVariant: { type: Map, of: String }, // e.g. { "Size": "M", "Color": "Red" }
  hasVariants: { type: Boolean, default: false },
  variants: [variantSchema],
  stock: { type: Number, default: 0 },
  lowStockThreshold: { type: Number, default: 5 },
  weight: { type: Number, default: 0 },
  dimensions: {
    length: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
  },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  isOnSale: { type: Boolean, default: false },
  taxClass: { type: String, default: '' },
  seo: {
    title: String,
    description: String,
    keywords: [String],
  },
  meta: {
    views: { type: Number, default: 0 },
    purchases: { type: Number, default: 0 },
    ratings: [ratingSchema],
    averageRating: { type: Number, default: 0 },
  },
}, { timestamps: true });

productSchema.index({ name: 'text', description: 'text', tags: 'text', brand: 'text' });

productSchema.methods.calculateAverageRating = function () {
  if (this.meta.ratings.length === 0) {
    this.meta.averageRating = 0;
  } else {
    const sum = this.meta.ratings.reduce((acc, r) => acc + r.rating, 0);
    this.meta.averageRating = Math.round((sum / this.meta.ratings.length) * 10) / 10;
  }
};

module.exports = mongoose.model('Product', productSchema);
