const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const sendEmail = require('../utils/email');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again after 15 minutes.' },
});

const accountCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many accounts created, please try again after an hour.' },
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many password reset attempts, please try again after an hour.' },
});

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

const sendToken = (res, user, statusCode = 200) => {
  const token = signToken(user._id);
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.status(statusCode).json({ success: true, user });
};

// POST /api/auth/register
router.post('/register', accountCreationLimiter, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], validate, async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });
    const user = await User.create({ name, email, password, phone });
    sendToken(res, user, 201);
  } catch (err) { next(err); }
});

// POST /api/auth/login
router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
], validate, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (user.status === 'blocked') return res.status(403).json({ success: false, message: 'Account blocked' });
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    sendToken(res, user);
  } catch (err) { next(err); }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// PUT /api/auth/update-profile
router.put('/update-profile', protect, [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
], validate, async (req, res, next) => {
  try {
    const { name, phone, avatar } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, phone, avatar }, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (err) { next(err); }
});

// PUT /api/auth/change-password
router.put('/change-password', protect, [
  body('oldPassword').notEmpty().withMessage('Old password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
], validate, async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(oldPassword))) {
      return res.status(400).json({ success: false, message: 'Old password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated' });
  } catch (err) { next(err); }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.cookie('token', '', { maxAge: 0 });
  res.json({ success: true, message: 'Logged out' });
});

// POST /api/auth/address
router.post('/address', protect, [
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
], validate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (req.body.isDefault) user.addresses.forEach(a => (a.isDefault = false));
    user.addresses.push(req.body);
    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (err) { next(err); }
});

// DELETE /api/auth/address/:id
router.delete('/address/:id', protect, [
  param('id').isMongoId().withMessage('Invalid address ID'),
], validate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.id);
    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (err) { next(err); }
});

// PUT /api/auth/address/:id
router.put('/address/:id', protect, [
  param('id').isMongoId().withMessage('Invalid address ID'),
], validate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const address = user.addresses.id(req.params.id);
    if (!address) return res.status(404).json({ success: false, message: 'Address not found' });

    // Update fields
    Object.assign(address, req.body);

    // If setting as default, unset others (logic already exists in post, let's replicate)
    if (req.body.isDefault) {
      user.addresses.forEach(a => {
        if (a._id.toString() !== req.params.id) a.isDefault = false;
      });
    }

    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (err) { next(err); }
});

// PUT /api/auth/wishlist/:productId
router.put('/wishlist/:productId', protect, [
  param('productId').isMongoId().withMessage('Invalid product ID'),
], validate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const pid = req.params.productId;
    const idx = user.wishlist.findIndex(id => id.toString() === pid);
    if (idx > -1) user.wishlist.splice(idx, 1);
    else user.wishlist.push(pid);
    await user.save();
    res.json({ success: true, wishlist: user.wishlist });
  } catch (err) { next(err); }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', passwordResetLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
], validate, async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.json({ success: true, message: 'If email exists, reset link sent' });
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${token}`;
    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset - LuxeStore',
        html: `
          <div style="max-width:600px;margin:0 auto;background:#0f0e0d;font-family:'Helvetica Neue',Arial,sans-serif;padding:32px;">
            <h1 style="color:#d4af37;letter-spacing:4px;text-align:center;">LUXESTORE</h1>
            <p style="color:#e8e0d0;font-size:14px;">You requested a password reset. Click the link below to reset your password:</p>
            <div style="text-align:center;margin:24px 0;">
              <a href="${resetUrl}" style="background:#d4af37;color:#0f0e0d;padding:12px 32px;text-decoration:none;border-radius:4px;font-weight:700;">Reset Password</a>
            </div>
            <p style="color:#a09882;font-size:12px;">This link expires in 30 minutes. If you didn't request this, please ignore this email.</p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('Failed to send reset email:', emailErr);
    }

    res.json({ success: true, message: 'If email exists, reset link sent' });
  } catch (err) { next(err); }
});

// PUT /api/auth/reset-password/:token
router.put('/reset-password/:token', [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], validate, async (req, res, next) => {
  try {
    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ resetPasswordToken: hashed, resetPasswordExpire: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    sendToken(res, user);
  } catch (err) { next(err); }
});

module.exports = router;
