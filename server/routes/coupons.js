const express = require('express');
const router = express.Router();
const { Coupon } = require('../models/index');
const { protect, authorize } = require('../middleware/auth');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');

router.get('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (err) { next(err); }
});

router.post('/validate', protect, [
  body('code').trim().notEmpty().withMessage('Coupon code is required'),
  body('subtotal').isFloat({ min: 0 }).withMessage('Subtotal must be a non-negative number'),
], validate, async (req, res, next) => {
  try {
    const { code, subtotal, items } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon || !coupon.isValid()) return res.status(400).json({ success: false, message: 'Invalid or expired coupon' });
    if (subtotal < coupon.minPurchase) return res.status(400).json({ success: false, message: `Min purchase ₹${coupon.minPurchase} required` });
    const discount = coupon.calculateDiscount(items || [], subtotal);
    res.json({ success: true, coupon, discount });
  } catch (err) { next(err); }
});

router.post('/', protect, authorize('admin'), [
  body('code').trim().notEmpty().withMessage('Coupon code is required'),
  body('type').isIn(['percentage', 'fixed']).withMessage('Type must be percentage or fixed'),
  body('value').isFloat({ min: 0 }).withMessage('Value must be a non-negative number'),
  body('minPurchase').optional().isFloat({ min: 0 }).withMessage('Min purchase must be non-negative'),
  body('maxDiscount').optional().isFloat({ min: 0 }).withMessage('Max discount must be non-negative'),
], validate, async (req, res, next) => {
  try {
    const coupon = await Coupon.create({ ...req.body, code: req.body.code?.toUpperCase() });
    res.status(201).json({ success: true, coupon });
  } catch (err) { next(err); }
});

router.put('/:id', protect, authorize('admin'), [
  param('id').isMongoId().withMessage('Invalid coupon ID'),
  body('type').optional().isIn(['percentage', 'fixed']).withMessage('Type must be percentage or fixed'),
  body('value').optional().isFloat({ min: 0 }).withMessage('Value must be a non-negative number'),
], validate, async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, coupon });
  } catch (err) { next(err); }
});

router.delete('/:id', protect, authorize('admin'), [
  param('id').isMongoId().withMessage('Invalid coupon ID'),
], validate, async (req, res, next) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
