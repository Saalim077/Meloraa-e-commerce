const express = require('express');
const router = express.Router();
const { Order, Coupon } = require('../models/index');
const { Settings, EmailTemplate } = require('../models/Extended');
const { parseTemplate } = require('../utils/templateParser');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');
const sendEmail = require('../utils/email');
const { checkRMAEligibility } = require('../utils/rmaUtils');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { checkInventoryAlerts } = require('./admin');

// POST /api/orders
router.post('/', protect, [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.product').isMongoId().withMessage('Invalid product ID in items'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Item quantity must be at least 1'),
  body('shippingAddress').isObject().withMessage('Shipping address is required'),
  body('paymentMethod').isIn(['card', 'upi', 'netbanking', 'cod']).withMessage('Invalid payment method'),
], validate, async (req, res, next) => {
  require('fs').appendFileSync('order-request.log', `[${new Date().toISOString()}] REQUEST RECEIVED: ${JSON.stringify(req.body).substring(0, 100)}...\n`);
  try {
    const { items, shippingAddress, billingAddress, paymentMethod, couponCode, notes } = req.body;

    let subtotal = 0;
    const orderItems = [];

    // Fetch settings early for tax calculation
    let settings = await Settings.findOne();
    if (!settings) {
      settings = { taxEnabled: true, taxRate: 18, taxClasses: [], shippingEnabled: true, standardShippingCost: 99, freeShippingThreshold: 1000 };
    }

    let calculatedTax = 0;

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) return res.status(400).json({ success: false, message: `Product not found: ${item.product}` });

      let price = product.price;
      let variantFound = null;

      if (item.variant && product.hasVariants && product.variants && product.variants.length > 0) {
        variantFound = product.variants.find(v => v.name === item.variant);
        if (variantFound) {
          if (variantFound.price) price = variantFound.price;
          if (variantFound.stock < item.quantity) {
            return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name} (${item.variant})` });
          }
        }
      }

      if (!variantFound && product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });
      }

      const total = price * item.quantity;
      subtotal += total;
      orderItems.push({ product: product._id, variant: item.variant, quantity: item.quantity, price, total });

      if (settings.taxEnabled) {
        let rate = settings.taxRate || 0;
        if (product.taxClass && settings.taxClasses && Array.isArray(settings.taxClasses)) {
          const found = settings.taxClasses.find(c => c.name === product.taxClass);
          if (found) rate = found.rate;
        }
        calculatedTax += total * (rate / 100);
      }
    }

    // Deduct stock
    for (const item of orderItems) {
      const update = { $inc: { stock: -item.quantity, 'meta.purchases': item.quantity } };
      
      // If variant was used, decrement its specific stock too
      if (item.variant) {
        await Product.updateOne(
          { _id: item.product, 'variants.name': item.variant },
          { $inc: { 'variants.$.stock': -item.quantity, ...update.$inc } }
        );
      } else {
        await Product.findByIdAndUpdate(item.product, update);
      }
      // Trigger inventory alert check
      await checkInventoryAlerts(item.product);
    }

    let discount = 0;
    let couponRef = null;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (coupon && coupon.isValid() && subtotal >= coupon.minPurchase) {
        discount = coupon.calculateDiscount(orderItems, subtotal);
        coupon.usedCount += 1;
        await coupon.save();
        couponRef = coupon._id;
      }
    }

    const shipping = settings.shippingEnabled
      ? (subtotal - discount > (settings.freeShippingThreshold || 1000) ? 0 : (settings.standardShippingCost || 99))
      : 0;

    const taxableAmount = subtotal - discount + shipping;
    let taxMultiplier = 1;
    if (subtotal > 0) {
      taxMultiplier = taxableAmount / subtotal;
    }
    const tax = settings.taxEnabled ? Math.round(calculatedTax * taxMultiplier) : 0;
    const total = taxableAmount + tax;

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      subtotal,
      discount,
      shipping,
      tax,
      total,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentMethod,
      coupon: couponRef,
      notes,
    });

    // Send order confirmation email (don't block the response)
    const logDebug = (msg) => require('fs').appendFileSync('email-debug.log', `[${new Date().toISOString()}] ORDER ${order._id}: ${msg}\n`);

    const userDoc = req.user;
    const customerEmail = shippingAddress?.email || userDoc?.email;

    if (customerEmail) {
      logDebug(`Starting email process for ${customerEmail}`);

      (async () => {
        try {
          // Populate the just-created order directly
          logDebug(`Populating order items...`);
          await order.populate('items.product', 'name images');

          const betterItemRows = order.items.map(item => `
            <tr>
              <td style="padding:12px 16px;border-bottom:1px solid #2e2c29;">
                <div style="display:flex;align-items:center;gap:12px;">
                  ${item.product?.images?.[0] ? `<img src="${item.product.images[0]}" width="48" height="48" style="border-radius:6px;object-fit:cover;" />` : ''}
                  <span style="font-size:14px;color:#e8e0d0;">${item.product?.name || 'Product'}</span>
                </div>
              </td>
              <td style="padding:12px 16px;border-bottom:1px solid #2e2c29;font-size:14px;color:#a09882;text-align:center;">${item.quantity}</td>
              <td style="padding:12px 16px;border-bottom:1px solid #2e2c29;font-size:14px;color:#d4af37;text-align:right;font-family:monospace;">₹${item.total.toLocaleString('en-IN')}</td>
            </tr>
          `).join('');

          // Fetch template from DB
          const emailTemplate = await EmailTemplate.findOne({ name: 'order_confirmation', isActive: true });
          
          if (!emailTemplate) {
            logDebug(`ERROR: Order confirmation template not found in DB!`);
            return;
          }

          const templateData = {
            userName: userDoc?.name || 'Customer',
            orderId: order.orderNumber || order._id.toString(),
            orderIdShort: (order.orderNumber || order._id.toString()).substring(0, 8).toUpperCase(),
            orderDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
            paymentMethod: paymentMethod === 'cod' ? 'Cash on Delivery' : 'Card',
            itemRows: betterItemRows,
            subtotal: subtotal.toLocaleString('en-IN'),
            discountHtml: discount > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="font-size:14px;color:#6b9e6b;">Discount</span><span style="font-size:14px;color:#6b9e6b;font-family:monospace;">-₹${discount.toLocaleString('en-IN')}</span></div>` : '',
            shipping: shipping === 0 ? 'Free' : '₹' + shipping.toLocaleString('en-IN'),
            tax: tax.toLocaleString('en-IN'),
            total: total.toLocaleString('en-IN'),
            shippingName: `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`,
            shippingAddress: shippingAddress.address || '',
            shippingCityStateZip: `${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.zipCode || ''}`,
            shippingPhone: shippingAddress.phone ? '<br/>📞 ' + shippingAddress.phone : '',
            year: new Date().getFullYear()
          };

          const emailHtml = parseTemplate(emailTemplate.template, templateData);
          const emailSubject = parseTemplate(emailTemplate.subject, templateData);

          logDebug(`Calling sendEmail utility...`);
          await sendEmail({
            to: customerEmail,
            subject: emailSubject,
            html: emailHtml,
          });
          logDebug(`Email attempt finished.`);
        } catch (err) {
          logDebug(`ASYNC ERROR: ${err.message}`);
          console.error('Async order email failed:', err);
        }
      })();
    } else {
      logDebug(`No customer email found, skipping.`);
    }

    res.status(201).json({ success: true, order });
  } catch (err) { next(err); }
});

// GET /api/orders/my-orders
router.get('/my-orders', protect, async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).populate('items.product', 'name images slug').sort({ createdAt: -1 });
    const settings = await Settings.findOne() || {};

    const enrichedOrders = orders.map(order => {
      const orderObj = order.toObject();
      const cancelElig = checkRMAEligibility(order, 'cancel', settings);
      
      // Check if any return-related action is eligible
      const rmaTypes = ['return', 'refund', 'exchange'];
      const rmaResults = rmaTypes.map(type => ({ type, ...checkRMAEligibility(order, type, settings) }));
      const isRMAEligible = rmaResults.some(r => r.eligible);
      const rmaReason = rmaResults.find(r => !r.eligible)?.message || '';
      
      return {
        ...orderObj,
        canCancel: cancelElig.eligible,
        cancelReason: cancelElig.message,
        canReturn: isRMAEligible, // Renamed 'canReturn' to represent any RMA action
        returnReason: rmaReason
      };
    });

    res.json({ success: true, orders: enrichedOrders });
  } catch (err) { next(err); }
});

// GET /api/orders (admin)
router.get('/', protect, authorize('admin', 'staff'), async (req, res, next) => {
  try {
    const { status, paymentStatus, paymentMethod, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.orderStatus = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (paymentMethod) {
      if (paymentMethod === 'prepaid') {
        query.paymentMethod = { $ne: 'cod' };
      } else {
        query.paymentMethod = paymentMethod;
      }
    }
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    res.json({ success: true, orders, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (err) { next(err); }
});

// GET /api/orders/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email').populate('items.product', 'name images slug');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.user._id.toString() !== req.user._id.toString() && !['admin', 'staff'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, order });
  } catch (err) { next(err); }
});

// GET /api/orders/:id/return-eligibility
router.get('/:id/return-eligibility', protect, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    // Check ownership
    if (order.user.toString() !== req.user._id.toString() && !['admin', 'staff'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const settings = await Settings.findOne() || {};
    
    // Check eligibility for each type to give comprehensive feedback
    const types = ['return', 'refund', 'exchange'];
    const results = {};
    
    for (const type of types) {
      const eligibilityCheck = checkRMAEligibility(order, type, settings);
      results[type] = {
        eligible: eligibilityCheck.eligible,
        reason: eligibilityCheck.message || ''
      };
    }

    // Comprehensive eligibility: True if ANY action is allowed
    const anyEligible = Object.values(results).some(r => r.eligible);
    const primaryReason = anyEligible ? '' : (results['return'].reason || results['refund'].reason || results['exchange'].reason || 'Not eligible for RMA');

    res.json({ 
      success: true,
      eligible: anyEligible,
      reason: primaryReason,
      eligibility: results,
      orderStatus: order.orderStatus,
      deliveredAt: order.deliveredAt
    });
  } catch (err) { next(err); }
});


// PUT /api/orders/:id/status (admin)
router.put('/:id/status', protect, authorize('admin', 'staff'), [
  param('id').isMongoId().withMessage('Invalid order ID'),
  body('orderStatus').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'Refund Requested', 'refunded', 'partially-refunded']).withMessage('Invalid order status'),
  body('paymentStatus').optional().isIn(['pending', 'paid', 'failed', 'refunded']).withMessage('Invalid payment status'),
], validate, async (req, res, next) => {
  try {
    const { orderStatus, paymentStatus, trackingNumber } = req.body;
    const update = {};
    if (orderStatus) update.orderStatus = orderStatus;
    if (paymentStatus) update.paymentStatus = paymentStatus;
    if (trackingNumber) update.trackingNumber = trackingNumber;
    if (orderStatus === 'delivered') update.deliveredAt = new Date();
    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true }).populate('user', 'name email');
    res.json({ success: true, order });
  } catch (err) { next(err); }
});

// PUT /api/orders/:id/cancel
router.put('/:id/cancel', protect, [
  param('id').isMongoId().withMessage('Invalid order ID'),
], validate, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    if (order.user.toString() !== req.user._id.toString() && !['admin', 'staff'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const settings = await Settings.findOne() || {};
    const elig = checkRMAEligibility(order, 'cancel', settings);

    if (!elig.eligible) {
      return res.status(400).json({ success: false, message: elig.message || 'Cannot cancel this order' });
    }
    order.orderStatus = 'cancelled';
    await order.save();
    // Restore stock
    for (const item of order.items) {
      if (item.variant) {
        await Product.updateOne(
          { _id: item.product, 'variants.name': item.variant },
          { $inc: { 'variants.$.stock': item.quantity, stock: item.quantity } }
        );
      } else {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      }
    }
    res.json({ success: true, order });
  } catch (err) { next(err); }
});

// PUT /api/orders/:id/return-request (User)
router.put('/:id/return-request', protect, [
  param('id').isMongoId().withMessage('Invalid order ID'),
  body('reason').trim().notEmpty().withMessage('Return reason is required'),
], validate, async (req, res, next) => {
  try {
    const { reason } = req.body;
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.orderStatus !== 'delivered') {
      return res.status(400).json({ success: false, message: 'Only delivered orders can be returned' });
    }

    order.orderStatus = 'Refund Requested';
    order.returnStatus = 'requested';
    order.returnReason = reason;
    order.returnDate = new Date();
    await order.save();

    res.json({ success: true, order, message: 'Return request submitted' });
  } catch (err) { next(err); }
});

// PUT /api/orders/:id/return-process (Admin)
router.put('/:id/return-process', protect, authorize('admin', 'staff'), [
  param('id').isMongoId().withMessage('Invalid order ID'),
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
], validate, async (req, res, next) => {
  try {
    const { status, refundAmount } = req.body; // status: 'approved' or 'rejected'
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (status === 'approved') {
      order.returnStatus = 'approved';
      order.orderStatus = 'refunded'; // Adding 'refunded' to enum in model might be needed, checking...
      order.paymentStatus = 'refunded';
      order.refundAmount = refundAmount || order.total;

      // Restore stock on refund approval
      for (const item of order.items) {
        if (item.variant) {
          await Product.updateOne(
            { _id: item.product, 'variants.name': item.variant },
            { $inc: { 'variants.$.stock': item.quantity, stock: item.quantity } }
          );
        } else {
          await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
        }
      }
    } else {
      order.returnStatus = 'rejected';
      order.orderStatus = 'delivered'; // Reset to delivered if rejected
    }

    await order.save();
    res.json({ success: true, order });
  } catch (err) { next(err); }
});

// POST /api/orders/:id/refund (Admin)
router.post('/:id/refund', protect, authorize('admin', 'staff'), [
  param('id').isMongoId().withMessage('Invalid order ID'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Refund amount must be greater than 0'),
], validate, async (req, res, next) => {
  try {
    const { amount, reason, restockItems, itemsToRestock } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const totalRefundedSoFar = order.totalRefunded || 0;
    if (totalRefundedSoFar + amount > order.total) {
      return res.status(400).json({ success: false, message: `Refund amount exceeds order total. Remaining: ₹${order.total - totalRefundedSoFar}` });
    }

    // Process restocking if requested
    if (restockItems && itemsToRestock && Array.isArray(itemsToRestock)) {
      for (const item of itemsToRestock) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      }
    }

    // Add to refund history
    order.refunds.push({
      amount,
      reason,
      restocked: !!restockItems,
      items: itemsToRestock || []
    });

    order.totalRefunded = totalRefundedSoFar + amount;
    
    // Update status
    if (order.totalRefunded >= order.total) {
      order.orderStatus = 'refunded';
      order.paymentStatus = 'refunded';
    } else {
      order.orderStatus = 'partially-refunded';
    }

    await order.save();
    res.json({ success: true, order });
  } catch (err) { next(err); }
});

module.exports = router;
