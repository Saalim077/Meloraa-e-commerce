const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET /api/products
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { search, category, brand, minPrice, maxPrice, isOnSale, isNew, isFeatured, sort, page = 1, limit = 12 } = req.query;
    const query = {};

    if (search) query.$text = { $search: search };
    if (category) query.category = category;
    if (brand) query.brand = new RegExp(escapeRegex(brand), 'i');
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (isOnSale === 'true') query.isOnSale = true;
    if (isNew === 'true') query.isNewArrival = true;
    if (isFeatured === 'true') query.isFeatured = true;
    query.isActive = true;

    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      'price-asc': { price: 1 },
      'price-desc': { price: -1 },
      popular: { 'meta.purchases': -1 },
      rating: { 'meta.averageRating': -1 },
    };
    const sortOption = sortMap[sort] || { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query).populate('category', 'name slug').sort(sortOption).skip(skip).limit(Number(limit));

    res.json({
      success: true,
      products,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (err) { next(err); }
});

// GET /api/products/:id (by ID or slug)
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    // Try to find by ID first, then by slug
    let product = await Product.findById(req.params.id)
      .populate('category', 'name slug sizeChart')
      .populate('subCategory', 'name slug sizeChart');
    
    if (!product) {
      product = await Product.findOne({ slug: req.params.id })
        .populate('category', 'name slug sizeChart')
        .populate('subCategory', 'name slug sizeChart');
    }
    
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    
    product.meta.views += 1;
    await product.save({ validateBeforeSave: false });
    res.json({ success: true, product });
  } catch (err) { next(err); }
});

// POST /api/products
router.post('/', protect, authorize('admin', 'staff'), [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('category').optional().isMongoId().withMessage('Invalid category ID'),
], validate, async (req, res, next) => {
  try {
    if (!req.body.slug) req.body.slug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, product });
  } catch (err) { next(err); }
});

// PUT /api/products/:id
router.put('/:id', protect, authorize('admin', 'staff'), [
  param('id').isMongoId().withMessage('Invalid product ID'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
], validate, async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    
    // Trigger inventory alert check
    const { checkInventoryAlerts } = require('./admin');
    await checkInventoryAlerts(product._id);
    
    res.json({ success: true, product });
  } catch (err) { next(err); }
});

// DELETE /api/products/:id
router.delete('/:id', protect, authorize('admin'), [
  param('id').isMongoId().withMessage('Invalid product ID'),
], validate, async (req, res, next) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) { next(err); }
});

// POST /api/products/:id/reviews
router.post('/:id/reviews', protect, [
  param('id').isMongoId().withMessage('Invalid product ID'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
], validate, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const existing = product.meta.ratings.find(r => r.user.toString() === req.user._id.toString());
    if (existing) return res.status(400).json({ success: false, message: 'Already reviewed' });
    product.meta.ratings.push({ user: req.user._id, rating: req.body.rating, review: req.body.review });
    product.calculateAverageRating();
    await product.save();
    res.json({ success: true, product });
  } catch (err) { next(err); }
});

// GET /api/products/:id/related
router.get('/:id/related', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const related = await Product.find({ category: product.category, _id: { $ne: product._id }, isActive: true }).limit(4);
    res.json({ success: true, products: related });
  } catch (err) { next(err); }
});

module.exports = router;
