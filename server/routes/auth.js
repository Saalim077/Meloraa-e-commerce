const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { protect } = require('../middleware/auth');
const sendEmail = require('../utils/email');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // Increased for development testing
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again after 15 minutes.' },
});

const accountCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30, // Increased for development testing
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many accounts created, please try again after an hour.' },
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30, // Increased for development testing
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
  body('identifier').trim().notEmpty().withMessage('Email or Phone is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], validate, async (req, res, next) => {
  try {
    const { name, identifier, password } = req.body;
    const isEmail = identifier.includes('@');
    const emailVal = isEmail ? identifier.toLowerCase() : `${identifier}@luxestore-temp.com`;
    const phoneVal = isEmail ? '' : identifier;

    const existing = await User.findOne({ $or: [{ email: emailVal }, { phone: identifier }] });
    if (existing) {
      if (existing.status === 'pending') {
        const plainOtp = Math.floor(100000 + Math.random() * 900000).toString();
        existing.otp = await bcrypt.hash(plainOtp, 12);
        existing.otpExpire = Date.now() + 10 * 60 * 1000;
        existing.name = name;
        existing.password = password;
        await existing.save();

        if (isEmail) {
          sendEmail({
            to: existing.email,
            subject: 'Your LuxeStore Registration OTP',
            html: `
              <div style="max-width:600px;margin:0 auto;background:#0f0e0d;font-family:'Helvetica Neue',Arial,sans-serif;padding:32px;text-align:center;">
                <h1 style="color:#d4af37;letter-spacing:4px;">LUXESTORE</h1>
                <p style="color:#e8e0d0;font-size:16px;">Your One-Time Password (OTP) for account verification is:</p>
                <div style="margin:32px 0;padding:20px;background:#1a1917;border:1px solid #33312e;border-radius:8px;font-size:32px;font-weight:700;letter-spacing:8px;color:#d4af37;">
                  ${plainOtp}
                </div>
                <p style="color:#a09882;font-size:12px;">This OTP is valid for 10 minutes.</p>
              </div>
            `,
          }).catch(e => console.error('OTP Email Failed:', e));
        } else {
          console.log(`[SMS TRANSPORT] Sending Registration OTP ${plainOtp} to phone number ${existing.phone}`);
        }
        return res.json({ success: true, message: 'OTP sent successfully for verification', userId: existing._id });
      }

      return res.status(400).json({ success: false, message: 'This email or phone number is already registered. Please log in or reset your password.' });
    }

    const plainOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const user = new User({
      name,
      email: emailVal,
      phone: phoneVal,
      password,
      status: 'pending',
      emailVerified: false,
      otpExpire: Date.now() + 10 * 60 * 1000
    });
    user.otp = await bcrypt.hash(plainOtp, 12);
    await user.save();

    if (isEmail) {
      sendEmail({
        to: user.email,
        subject: 'Your LuxeStore Registration OTP',
        html: `
          <div style="max-width:600px;margin:0 auto;background:#0f0e0d;font-family:'Helvetica Neue',Arial,sans-serif;padding:32px;text-align:center;">
            <h1 style="color:#d4af37;letter-spacing:4px;">LUXESTORE</h1>
            <p style="color:#e8e0d0;font-size:16px;">Your One-Time Password (OTP) for account verification is:</p>
            <div style="margin:32px 0;padding:20px;background:#1a1917;border:1px solid #33312e;border-radius:8px;font-size:32px;font-weight:700;letter-spacing:8px;color:#d4af37;">
              ${plainOtp}
            </div>
            <p style="color:#a09882;font-size:12px;">This OTP is valid for 10 minutes.</p>
          </div>
        `,
      }).catch(e => console.error('OTP Email Failed:', e));
    } else {
      console.log(`[SMS TRANSPORT] Sending Registration OTP ${plainOtp} to phone number ${user.phone}`);
    }

    res.json({ success: true, message: 'OTP sent successfully for verification', userId: user._id });
  } catch (err) { next(err); }
});

// POST /api/auth/verify-register
router.post('/verify-register', accountCreationLimiter, [
  body('userId').isMongoId().withMessage('Invalid User ID'),
  body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('Valid 6-digit OTP is required'),
], validate, async (req, res, next) => {
  try {
    const { userId, otp } = req.body;
    const user = await User.findById(userId).select('+otp +otpExpire');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.status !== 'pending') return res.status(400).json({ success: false, message: 'Account is already verified' });

    if (!user.otpExpire || user.otpExpire < Date.now()) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please register again to receive a new code.' });
    }

    if (!(await user.compareOtp(otp))) {
      return res.status(401).json({ success: false, message: 'Invalid OTP' });
    }

    user.status = 'active';
    user.emailVerified = true;
    user.otp = undefined;
    user.otpExpire = undefined;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendToken(res, user, 201);
  } catch (err) { next(err); }
});

// POST /api/auth/login
router.post('/login', authLimiter, [
  body('email').trim().notEmpty().withMessage('Email or Phone is required'),
  body('password').notEmpty().withMessage('Password is required'),
], validate, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ $or: [{ email: email.toLowerCase() }, { phone: email }] }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (user.status === 'pending') return res.status(403).json({ success: false, message: 'Account not verified. Please complete registration OTP verification.' });
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
  body('identifier').trim().notEmpty().withMessage('Email or Phone Number is required'),
], validate, async (req, res, next) => {
  try {
    const { identifier } = req.body;
    const user = await User.findOne({ $or: [{ email: identifier.toLowerCase() }, { phone: identifier }] });
    if (!user) return res.json({ success: true, message: 'If account exists, reset instructions have been sent.' });

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${token}`;
    
    if (user.email && user.email.includes('@') && !user.email.includes('luxestore-temp.com')) {
      try {
        await sendEmail({
          to: user.email,
          subject: 'Password Reset - MELORAA',
          html: `
            <div style="max-width:600px;margin:0 auto;background:#faf8f6;font-family:'Helvetica Neue',Arial,sans-serif;padding:32px;border:1px solid #e5e2df;border-radius:12px;">
              <h1 style="color:#4f0c10;letter-spacing:4px;text-align:center;font-family:Georgia,serif;">MELORAA</h1>
              <p style="color:#1a1a1a;font-size:14px;line-height:1.6;">You requested a password reset. Click the link below to set your new password:</p>
              <div style="text-align:center;margin:24px 0;">
                <a href="${resetUrl}" style="background:#4f0c10;color:white;padding:12px 32px;text-decoration:none;border-radius:8px;font-weight:700;display:inline-block;">Reset Password</a>
              </div>
              <p style="color:#8a8a8a;font-size:12px;">This link is valid for 30 minutes. If you did not request this reset, please ignore this email.</p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error('Failed to send reset email:', emailErr);
      }
    } else if (user.phone) {
      console.log(`[SMS TRANSPORT] Password Reset Link for phone ${user.phone}: ${resetUrl}`);
    }

    res.json({ success: true, message: 'If account exists, password reset instructions have been sent.' });
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
