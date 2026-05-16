// users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

router.get('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { search, role, status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (search) query.$or = [{ name: new RegExp(escapeRegex(search), 'i') }, { email: new RegExp(escapeRegex(search), 'i') }];
    if (role) query.role = role;
    if (status) query.status = status;
    const total = await User.countDocuments(query);
    const users = await User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, users, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

router.put('/:id/status', protect, authorize('admin'), [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('status').isIn(['active', 'blocked']).withMessage('Status must be active or blocked'),
], validate, async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json({ success: true, user });
  } catch (err) { next(err); }
});

router.put('/:id/role', protect, authorize('admin'), [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('role').isIn(['user', 'staff', 'admin']).withMessage('Role must be user, staff, or admin'),
], validate, async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true });
    res.json({ success: true, user });
  } catch (err) { next(err); }
});

router.delete('/:id', protect, authorize('admin'), [
  param('id').isMongoId().withMessage('Invalid user ID'),
], validate, async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) { next(err); }
});

router.get('/:id/details', protect, authorize('admin', 'staff'), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const { Order } = require('../models/index');
    const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).populate('items.product', 'name images');
    
    const stats = {
      orderCount: orders.length,
      totalSpent: orders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.total, 0),
      lastOrder: orders[0] ? orders[0].createdAt : null,
    };

    res.json({ success: true, user, orders, stats });
  } catch (err) { next(err); }
});

module.exports = router;
