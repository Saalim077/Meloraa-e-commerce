const express = require('express');
const router = express.Router();
const { Category } = require('../models/index');
const { protect, authorize } = require('../middleware/auth');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');

router.get('/', async (req, res, next) => {
  try {
    const filter = req.query.all === 'true' ? {} : { isActive: true };
    const categories = await Category.find(filter).sort({ order: 1, name: 1 });
    res.json({ success: true, categories });
  } catch (err) { next(err); }
});

router.post('/', protect, authorize('admin'), [
  body('name').trim().notEmpty().withMessage('Category name is required'),
], validate, async (req, res, next) => {
  try {
    if (!req.body.slug) req.body.slug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, category });
  } catch (err) { next(err); }
});

router.put('/:id', protect, authorize('admin'), [
  param('id').isMongoId().withMessage('Invalid category ID'),
  body('name').optional().trim().notEmpty().withMessage('Category name cannot be empty'),
], validate, async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, category });
  } catch (err) { next(err); }
});

router.delete('/:id', protect, authorize('admin'), [
  param('id').isMongoId().withMessage('Invalid category ID'),
], validate, async (req, res, next) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
