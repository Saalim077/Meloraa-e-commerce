const express = require('express');
const { Review, InventoryAlert } = require('../models/Extended');
const { Product } = require('../models');
const { protect, authorize } = require('../middleware/auth');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');

const router = express.Router();

// ─── GET All Reviews (Admin) ──────────────────────────────────────────────────
router.get('/', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const { page = 1, limit = 15, status = '', product = '', search = '' } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (product) filter.product = product;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const reviews = await Review
      .find(filter)
      .populate('product', 'name')
      .populate('user', 'name email')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Review.countDocuments(filter);

    res.json({
      reviews,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET Single Review ────────────────────────────────────────────────────────
router.get('/:id', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const review = await Review
      .findById(req.params.id)
      .populate('product')
      .populate('user', 'name email phone');
    
    if (!review) return res.status(404).json({ message: 'Review not found' });
    res.json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Update Review Status (Approve/Reject) ────────────────────────────────────
router.put('/:id/status', protect, authorize('admin', 'staff'), [
  param('id').isMongoId().withMessage('Invalid review ID'),
  body('status').isIn(['pending', 'approved', 'rejected']).withMessage('Status must be pending, approved, or rejected'),
], validate, async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status, rejectionReason: status === 'rejected' ? rejectionReason : null },
      { new: true }
    );

    if (!review) return res.status(404).json({ message: 'Review not found' });
    
    // Update product rating if approved
    if (status === 'approved') {
      const approvedReviews = await Review.find({ product: review.product, status: 'approved' });
      const avgRating = approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length;
      await Product.findByIdAndUpdate(review.product, { 'meta.averageRating': avgRating.toFixed(1) });
    }

    res.json({ message: 'Review updated', review });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Delete Review ────────────────────────────────────────────────────────────
router.delete('/:id', protect, authorize('admin'), [
  param('id').isMongoId().withMessage('Invalid review ID'),
], validate, async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET Reviews by Product (Public) ──────────────────────────────────────────
router.get('/product/:productId', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const reviews = await Review
      .find({ product: req.params.productId, status: 'approved' })
      .populate('user', 'name avatar')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ helpful: -1, createdAt: -1 });

    const total = await Review.countDocuments({ product: req.params.productId, status: 'approved' });

    res.json({
      reviews,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST New Review (Customer) ───────────────────────────────────────────────
router.post('/', protect, [
  body('productId').isMongoId().withMessage('Invalid product ID'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('title').trim().notEmpty().withMessage('Review title is required'),
  body('comment').optional().trim(),
], validate, async (req, res) => {
  try {
    const { productId, rating, title, comment, images } = req.body;
    
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const existingReview = await Review.findOne({ product: productId, user: req.user.id });
    if (existingReview) return res.status(400).json({ message: 'You have already reviewed this product' });

    const review = await Review.create({
      product: productId,
      user: req.user.id,
      rating,
      title,
      comment,
      images: images || [],
    });

    await review.populate('user', 'name avatar');
    res.status(201).json({ message: 'Review submitted for approval', review });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
