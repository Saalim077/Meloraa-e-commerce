const express = require('express');
const router = express.Router();
const { Order, Coupon } = require('../models/index');
const { Settings, EmailTemplate } = require('../models/Extended');
const { parseTemplate } = require('../utils/templateParser');
const Product = require('../models/Product');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const sendEmail = require('../utils/email');
const emailTemplates = require('../utils/emailTemplates');
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
      
      let rate = settings.taxRate || 0;
      if (product.taxClass && settings.taxClasses && Array.isArray(settings.taxClasses)) {
        const found = settings.taxClasses.find(c => c.name === product.taxClass);
        if (found) rate = found.rate;
      }

      let itemSku = product.sku;
      if (item.variant && product.variants) {
        const v = product.variants.find(x => x.name === item.variant);
        if (v && v.sku) itemSku = v.sku;
      }

      orderItems.push({ 
        product: product._id, 
        variant: item.variant, 
        quantity: item.quantity, 
        sku: itemSku,
        hsnCode: product.hsnCode || '', 
        taxRate: rate,
        price, 
        total 
      });

      if (settings.taxEnabled) {
        if (settings.taxInclusive) {
          // Extract tax: Price * (rate / (100 + rate))
          calculatedTax += total * (rate / (100 + rate));
        } else {
          // Add tax: Price * (rate / 100)
          calculatedTax += total * (rate / 100);
        }
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

    let tax = 0;
    let finalTotal = taxableAmount;

    if (settings.taxEnabled) {
      if (settings.taxInclusive) {
        // Price includes tax, extract it: Tax = Total - (Total / (1 + Rate))
        // Since we have multiple rates, we sum the extracted tax
        tax = Math.round(calculatedTax * taxMultiplier);
        // finalTotal is already correct (subtotal - discount + shipping)
      } else {
        // Price is base, add tax on top
        tax = Math.round(calculatedTax * taxMultiplier);
        finalTotal = taxableAmount + tax;
      }
    }

    const total = finalTotal;

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
            logDebug(`No DB template found, using built-in fallback.`);
            // Fallback built-in template
            const fallbackHtml = `
              <div style="max-width:600px;margin:0 auto;background:#0f0e0d;font-family:'Helvetica Neue',Arial,sans-serif;padding:32px;">
                <h1 style="color:#d4af37;letter-spacing:4px;text-align:center;font-size:28px;">LUXESTORE</h1>
                <div style="background:#1a1917;border:1px solid #33312e;border-radius:8px;padding:32px;margin-top:24px;">
                  <h2 style="color:#fff;font-size:20px;margin-top:0;">Order Confirmed!</h2>
                  <p style="color:#b3aea6;">Hi ${userDoc?.name || 'Customer'}, thank you for your order. We have received it and are preparing it for shipment.</p>
                  <div style="background:#0f0e0d;border:1px dashed #33312e;padding:16px;border-radius:6px;margin:20px 0;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="color:#b3aea6;font-size:14px;">Order ID:</span><span style="color:#fff;font-size:14px;">#${(order.orderNumber || order._id.toString()).slice(-8).toUpperCase()}</span></div>
                    <div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="color:#b3aea6;font-size:14px;">Total:</span><span style="color:#d4af37;font-size:14px;font-weight:700;">₹${total.toLocaleString('en-IN')}</span></div>
                    <div style="display:flex;justify-content:space-between;"><span style="color:#b3aea6;font-size:14px;">Payment:</span><span style="color:#fff;font-size:14px;">${paymentMethod === 'cod' ? 'Cash on Delivery' : 'Card'}</span></div>
                  </div>
                  <div style="text-align:center;margin-top:24px;">
                    <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/profile" style="background:#d4af37;color:#0f0e0d;padding:12px 32px;text-decoration:none;border-radius:4px;font-weight:700;display:inline-block;">View Order</a>
                  </div>
                </div>
                <p style="color:#6b665e;font-size:12px;text-align:center;margin-top:24px;">This email was sent by LuxeStore. If you have questions, contact our concierge team.</p>
              </div>
            `;
            await sendEmail({ to: customerEmail, subject: `Order Confirmed - #${(order.orderNumber || order._id.toString()).slice(-8).toUpperCase()}`, html: fallbackHtml });
            logDebug(`Fallback email sent successfully.`);
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

    // Fix #23: Notify admin about the new order
    const adminEmail = process.env.ADMIN_EMAIL || process.env.STORE_EMAIL;
    if (adminEmail) {
      sendEmail({
        to: adminEmail,
        subject: `New Order Received - #${order.orderNumber || order._id.toString().slice(-8).toUpperCase()}`,
        html: `
          <div style="max-width:600px;margin:0 auto;background:#0f0e0d;font-family:'Helvetica Neue',Arial,sans-serif;padding:32px;">
            <h1 style="color:#d4af37;letter-spacing:4px;text-align:center;font-size:24px;">NEW ORDER</h1>
            <div style="background:#1a1917;border:1px solid #33312e;border-radius:8px;padding:24px;margin-top:16px;">
              <p style="color:#e8e0d0;margin:0 0 12px;"><strong style="color:#d4af37;">Order:</strong> #${order.orderNumber || order._id.toString().slice(-8).toUpperCase()}</p>
              <p style="color:#e8e0d0;margin:0 0 12px;"><strong style="color:#d4af37;">Customer:</strong> ${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''} &lt;${customerEmail}&gt;</p>
              <p style="color:#e8e0d0;margin:0 0 12px;"><strong style="color:#d4af37;">Total:</strong> ₹${total.toLocaleString('en-IN')}</p>
              <p style="color:#e8e0d0;margin:0;"><strong style="color:#d4af37;">Payment:</strong> ${paymentMethod === 'cod' ? 'Cash on Delivery' : 'Card'}</p>
            </div>
            <div style="text-align:center;margin-top:20px;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/admin/orders" style="background:#d4af37;color:#0f0e0d;padding:12px 28px;text-decoration:none;border-radius:4px;font-weight:700;display:inline-block;">View in Admin Panel</a>
            </div>
          </div>
        `
      }).catch(e => console.error('Admin notification email failed:', e));
    }

    res.status(201).json({ success: true, order });
  } catch (err) { next(err); }
});

// GET /api/orders/my-orders (paginated)
router.get('/my-orders', protect, async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const totalCount = await Order.countDocuments({ user: req.user._id });
    const orders = await Order.find({ user: req.user._id })
      .populate('items.product', 'name images slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    const settings = await Settings.findOne() || {};

    const enrichedOrders = orders.map(order => {
      const orderObj = order.toObject();
      const cancelElig = checkRMAEligibility(order, 'cancel', settings);
      
      // Check if any return-related action is eligible
      const rmaTypes = ['return', 'refund', 'exchange'];
      const rmaResults = rmaTypes.map(type => ({ type, ...checkRMAEligibility(order, type, settings) }));
      const isRMAEligible = rmaResults.some(r => r.eligible);
      const rmaReason = rmaResults.find(r => !r.eligible)?.message || '';

      // Hide the Request Refund button if a return/refund is already in progress
      const returnAlreadyActive = ['requested', 'approved'].includes(order.returnStatus);
      
      return {
        ...orderObj,
        canCancel: cancelElig.eligible,
        cancelReason: cancelElig.message,
        canReturn: isRMAEligible && !returnAlreadyActive,
        returnReason: rmaReason
      };
    });

    res.json({ success: true, orders: enrichedOrders, pagination: { total: totalCount, page: Number(page), pages: Math.ceil(totalCount / Number(limit)) } });
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
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email').populate('items.product', 'name images slug');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.user && req.user && order.user._id.toString() !== req.user._id.toString() && !['admin', 'staff'].includes(req.user.role)) {
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
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Restore stock if admin cancels the order
    if (orderStatus === 'cancelled') {
      const originalOrder = await Order.findById(req.params.id);
      for (const item of (originalOrder?.items || [])) {
        if (item.variant) {
          await Product.updateOne(
            { _id: item.product, 'variants.name': item.variant },
            { $inc: { 'variants.$.stock': item.quantity, stock: item.quantity } }
          );
        } else {
          await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
        }
      }
    }

    // Send email notification if shipped, delivered, or cancelled
    if (orderStatus === 'shipped' || orderStatus === 'delivered' || orderStatus === 'cancelled') {
      const customerEmail = order.shippingAddress?.email || order.user?.email;
      if (customerEmail) {
        let emailData;
        if (orderStatus === 'shipped') emailData = await emailTemplates.buildShippedEmail(order);
        if (orderStatus === 'delivered') emailData = await emailTemplates.buildDeliveredEmail(order);
        if (orderStatus === 'cancelled') emailData = await emailTemplates.buildCancelledEmail(order);
        
        if (emailData) {
          sendEmail({
            to: customerEmail,
            subject: emailData.subject,
            html: emailData.html
          }).catch(e => console.error('Status Update Email Failed:', e));
        }
      }
    }

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

    // Send Cancellation Email
    await order.populate('user', 'name email');
    const customerEmail = order.shippingAddress?.email || order.user?.email;
    if (customerEmail) {
      const emailData = await emailTemplates.buildCancelledEmail(order);
      sendEmail({
        to: customerEmail,
        subject: emailData.subject,
        html: emailData.html
      }).catch(e => console.error('Cancel Email Failed:', e));
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

    // Send Return Request Received Email
    await order.populate('user', 'name email');
    const customerEmail = order.shippingAddress?.email || order.user?.email;
    if (customerEmail) {
      const emailData = await emailTemplates.buildRefundRequestedEmail(order);
      sendEmail({
        to: customerEmail,
        subject: emailData.subject,
        html: emailData.html
      }).catch(e => console.error('Return Request Email Failed:', e));
    }

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

    // Guard: Prevent double-processing
    if (order.returnStatus === status) {
      return res.status(400).json({ success: false, message: `Return is already in '${status}' status.` });
    }

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

      // Send Refund Processed Email
      await order.populate('user', 'name email');
      const customerEmail = order.shippingAddress?.email || order.user?.email;
      if (customerEmail) {
        const emailData = await emailTemplates.buildRefundProcessedEmail(order);
        sendEmail({
          to: customerEmail,
          subject: emailData.subject,
          html: emailData.html
        }).catch(e => console.error('Refund Processed Email Failed:', e));
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
