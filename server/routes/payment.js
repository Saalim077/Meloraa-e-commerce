const express = require('express');
const router = express.Router();
const { Order } = require('../models/index');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validate');

router.post('/create-intent', protect, [
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
  body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be a 3-letter code'),
], validate, async (req, res, next) => {
  try {
    const { amount, currency = 'inr' } = req.body;
    if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('your_stripe')) {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const intent = await stripe.paymentIntents.create({ amount: Math.round(amount * 100), currency });
      return res.json({ success: true, clientSecret: intent.client_secret });
    }
    // Demo mode
    res.json({ success: true, clientSecret: `demo_secret_${Date.now()}`, demo: true });
  } catch (err) { next(err); }
});

router.post('/verify', protect, [
  body('orderId').isMongoId().withMessage('Invalid order ID'),
  body('paymentId').trim().notEmpty().withMessage('Payment ID is required'),
], validate, async (req, res, next) => {
  try {
    const { orderId, paymentId } = req.body;
    const order = await Order.findByIdAndUpdate(orderId, { paymentStatus: 'paid', paymentId, orderStatus: 'confirmed' }, { new: true });
    res.json({ success: true, order });
  } catch (err) { next(err); }
});

module.exports = router;
