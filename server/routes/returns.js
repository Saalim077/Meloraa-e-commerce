const express = require('express');
const router = express.Router();
const Return = require('../models/Return');
const { Order } = require('../models/index');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');
const { Settings } = require('../models/Extended');
const { checkRMAEligibility } = require('../utils/rmaUtils');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');

// ─── CUSTOMER ROUTES ─────────────────────────────────────────────────────────

// POST /api/returns - Create a new RMA request
router.post('/', protect, [
  body('orderId').isMongoId().withMessage('Invalid order ID'),
  body('type').isIn(['return', 'refund', 'exchange']).withMessage('Type must be return, refund, or exchange'),
  body('reason').isIn(['defective', 'wrong_item', 'not_as_described', 'size_issue', 'changed_mind', 'damaged_in_transit', 'missing_parts', 'other']).withMessage('Invalid reason'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.product').isMongoId().withMessage('Invalid product ID in items'),
  body('items.*.orderItem').isMongoId().withMessage('Invalid order item ID'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Item quantity must be at least 1'),
  body('items.*.condition').isIn(['unopened', 'opened', 'damaged']).withMessage('Invalid item condition'),
  body('pickupAddress').isObject().withMessage('Pickup address is required'),
  body('refundMethod').optional().isIn(['original_payment', 'store_credit', 'bank_transfer']).withMessage('Invalid refund method'),
], validate, async (req, res, next) => {
  try {
    const { orderId, type, reason, reasonDetails, items, photos, refundMethod, exchangeItems, pickupAddress } = req.body;

    // 1. Validate Order
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    // Check ownership
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // 2. Dynamic Eligibility Check
    const settings = await Settings.findOne() || {};
    const eligibility = checkRMAEligibility(order, type, settings);
    
    if (!eligibility.eligible) {
      return res.status(400).json({ success: false, message: eligibility.message });
    }

    // 2. Validate Items
    for (const item of items) {
      const orderItem = order.items.find(oi => oi._id.toString() === item.orderItem.toString());
      if (!orderItem) {
        return res.status(400).json({ success: false, message: `Item ${item.orderItem} not found in order` });
      }
      if (item.quantity > orderItem.quantity) {
        return res.status(400).json({ success: false, message: `Return quantity exceeds ordered quantity for ${orderItem.product}` });
      }
    }

    // 3. Check for existing RMA for these items (simplified: check if any pending/approved RMA for this order)
    const existingRMA = await Return.findOne({
      order: orderId,
      status: { $in: ['pending', 'approved', 'pickup_scheduled', 'in_transit', 'received', 'inspecting'] }
    });
    // Note: A more complex check would look at individual items, but for now we follow the "One RMA per order" simplified rule or block if items overlap
    if (existingRMA) {
      // Check if items overlap or just block the whole order for simplicity as per requirement "Block if there's already a pending/approved RMA for the same order (allow for different items)"
      // Let's implement the "allow for different items" part
      const overlapping = existingRMA.items.some(ei => items.some(ni => ni.orderItem.toString() === ei.orderItem.toString()));
      if (overlapping) {
        return res.status(400).json({ success: false, message: 'A return request is already in progress for some of these items' });
      }
    }

    // 4. Create Return
    const rma = await Return.create({
      order: orderId,
      user: req.user._id,
      type,
      reason,
      reasonDetails,
      items,
      photos,
      refundMethod,
      exchangeItems,
      pickupAddress,
      status: 'pending'
    });

    // 5. Update Order status for visibility
    order.orderStatus = 'Refund Requested';
    order.returnStatus = 'requested';
    await order.save();

    res.status(201).json({ success: true, rma });
  } catch (err) { next(err); }
});

// GET /api/returns/my-returns - List customer's RMAs
router.get('/my-returns', protect, async (req, res, next) => {
  try {
    const returns = await Return.find({ user: req.user._id })
      .populate('order', 'orderNumber total createdAt')
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 });

    res.json({ success: true, returns });
  } catch (err) { next(err); }
});

// GET /api/returns/my-returns/:id - Single RMA details
router.get('/my-returns/:id', protect, async (req, res, next) => {
  try {
    const rma = await Return.findOne({ _id: req.params.id, user: req.user._id })
      .populate('order', 'orderNumber total createdAt deliveredAt')
      .populate('items.product', 'name images sku')
      .populate('exchangeOrder', 'orderNumber status');

    if (!rma) return res.status(404).json({ success: false, message: 'Return request not found' });
    res.json({ success: true, rma });
  } catch (err) { next(err); }
});

// PUT /api/returns/my-returns/:id/cancel - Cancel RMA
router.put('/my-returns/:id/cancel', protect, [
  param('id').isMongoId().withMessage('Invalid return ID'),
], validate, async (req, res, next) => {
  try {
    const rma = await Return.findOne({ _id: req.params.id, user: req.user._id });
    if (!rma) return res.status(404).json({ success: false, message: 'Return request not found' });

    if (!rma.canBeCancelled()) {
      return res.status(400).json({ success: false, message: `Cannot cancel return in ${rma.status} status` });
    }

    rma.status = 'cancelled';
    rma.timeline.push({
      status: 'cancelled',
      message: 'Cancelled by customer',
      date: new Date(),
      updatedBy: req.user._id
    });

    await rma.save();
    res.json({ success: true, rma });
  } catch (err) { next(err); }
});

// ─── ADMIN ROUTES ────────────────────────────────────────────────────────────

// GET /api/returns - List all RMAs (Admin)
router.get('/', protect, authorize('admin', 'staff'), async (req, res, next) => {
  console.log(`[DEBUG] GET /api/returns - query: ${JSON.stringify(req.query)}`);
  try {
    const { status, type, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (type) query.type = type;
    if (search) {
      query.$or = [
        { rmaNumber: new RegExp(search, 'i') },
        // For customer name/email, we need to populate or use aggregation, 
        // but for simple cases we can just search rmaNumber first.
        // Better: join with User
      ];
    }

    const count = await Return.countDocuments(query);
    const returns = await Return.find(query)
      .populate('user', 'name email')
      .populate('order', 'orderNumber total')
      .populate('items.product', 'name images sku')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      returns,
      pagination: {
        total: count,
        page: Number(page),
        pages: Math.ceil(count / Number(limit))
      }
    });
  } catch (err) { 
    console.error(`[DEBUG ERROR] GET /api/returns:`, err);
    next(err); 
  }
});

// GET /api/returns/analytics - Analytics for Admin
router.get('/analytics', protect, authorize('admin', 'staff'), async (req, res, next) => {
  console.log(`[DEBUG] GET /api/returns/analytics`);
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalReturns,
      pendingCount,
      approvedCount,
      completedCount,
      refundedAmountData,
      totalOrdersCount,
      topReasons,
      typesBreakdown
    ] = await Promise.all([
      Return.countDocuments(),
      Return.countDocuments({ status: 'pending' }),
      Return.countDocuments({ status: 'approved' }),
      Return.countDocuments({ status: 'completed' }),
      Return.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$refundAmount' } } }
      ]),
      Order.countDocuments(),
      Return.aggregate([
        { $group: { _id: '$reason', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      Return.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        totalReturns,
        pendingCount,
        approvedCount,
        completedCount,
        refundedAmount: refundedAmountData[0]?.total || 0,
        returnRate: totalOrdersCount > 0 ? ((totalReturns / totalOrdersCount) * 100).toFixed(2) : 0,
      },
      topReturnReasons: topReasons.map(r => ({ reason: r._id, count: r.count })),
      returnsByType: typesBreakdown.map(t => ({ type: t._id, count: t.count }))
    });
  } catch (err) { 
    console.error(`[DEBUG ERROR] GET /api/returns/analytics:`, err);
    next(err); 
  }
});

// GET /api/returns/:id - Admin detail view
router.get('/:id', protect, authorize('admin', 'staff'), async (req, res, next) => {
  try {
    const rma = await Return.findById(req.params.id)
      .populate('user', 'name email')
      .populate('order')
      .populate('items.product', 'name images sku')
      .populate('exchangeOrder', 'orderNumber status items');

    if (!rma) return res.status(404).json({ success: false, message: 'Return request not found' });
    res.json({ success: true, rma });
  } catch (err) { next(err); }
});

// PUT /api/returns/:id/status - Update Status (Admin)
router.put('/:id/status', protect, authorize('admin', 'staff'), [
  param('id').isMongoId().withMessage('Invalid return ID'),
  body('status').isIn(['pending', 'approved', 'rejected', 'pickup_scheduled', 'in_transit', 'received', 'inspecting', 'completed', 'cancelled']).withMessage('Invalid status'),
], validate, async (req, res, next) => {
  try {
    const { status, adminNotes, customerNotes, rejectionReason, refundAmount, storeCredit, trackingNumber } = req.body;
    const rma = await Return.findById(req.params.id).populate('order items.product');

    if (!rma) return res.status(404).json({ success: false, message: 'Return request not found' });

    // Validate Status Change
    if (status === 'rejected' && !rejectionReason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    // Update fields
    rma.status = status;
    if (adminNotes) rma.adminNotes = adminNotes;
    if (customerNotes) rma.customerNotes = customerNotes;
    if (rejectionReason) rma.rejectionReason = rejectionReason;
    if (refundAmount) rma.refundAmount = refundAmount;
    if (storeCredit) rma.storeCredit = storeCredit;
    if (trackingNumber) rma.trackingNumber = trackingNumber;

    // Timeline entry
    rma.timeline.push({
      status,
      message: `Status updated to ${status} by ${req.user.name}`,
      date: new Date(),
      updatedBy: req.user._id
    });

    // Sync status with parent Order
    const order = await Order.findById(rma.order);
    if (order) {
      if (status === 'approved' || status === 'pickup_scheduled' || status === 'in_transit' || status === 'received' || status === 'inspecting') {
        order.returnStatus = 'approved';
      } else if (status === 'rejected') {
        order.returnStatus = 'rejected';
        order.orderStatus = 'delivered'; // Revert to delivered if request rejected
      } else if (status === 'completed') {
        order.returnStatus = 'completed';
        order.orderStatus = 'refunded';
      } else if (status === 'cancelled') {
        order.returnStatus = 'none';
        order.orderStatus = 'delivered';
      }
      await order.save();
    }

    // Special logic for 'completed'
    if (status === 'completed') {
      rma.resolvedAt = new Date();
      
      if (rma.type === 'refund' || rma.type === 'return') {
        // Handle stock restoration if requested
        for (const item of rma.items) {
          const product = await Product.findById(item.product);
          if (product) {
            product.stock += item.quantity;
            await product.save();
          }
        }
        
        // Update order status if all items are returned? 
        // For now, let's just mark the items in the order or push a refund record to the order model if it supports it
        // Update order status and refund record
        const orderToUpdate = await Order.findById(rma.order);
        if (orderToUpdate) {
          orderToUpdate.refunds.push({
            amount: rma.refundAmount || 0,
            reason: rma.reason,
            restocked: true,
            items: rma.items.map(i => ({ product: i.product, quantity: i.quantity }))
          });
          orderToUpdate.totalRefunded += (rma.refundAmount || 0);
          if (orderToUpdate.totalRefunded >= orderToUpdate.total) {
             orderToUpdate.paymentStatus = 'refunded';
          }
          await orderToUpdate.save();
        }
      }

      if (rma.type === 'exchange') {
        // Create a new Order for exchange items
        const originalOrder = await Order.findById(rma.order);
        const exchangeOrder = await Order.create({
          user: rma.user,
          items: rma.exchangeItems.map(i => ({
            product: i.product,
            variant: i.variant,
            quantity: i.quantity,
            price: 0, // Exchange item is ₹0
            total: 0
          })),
          subtotal: 0,
          total: 0,
          shipping: 0,
          tax: 0,
          shippingAddress: rma.pickupAddress, // Use pickup address or allow setting shipping address? 
          billingAddress: originalOrder.billingAddress,
          paymentMethod: 'cod',
          paymentStatus: 'paid',
          orderStatus: 'confirmed',
          notes: `Exchange order for ${rma.rmaNumber}`
        });
        rma.exchangeOrder = exchangeOrder._id;
      }
    }

    await rma.save();
    res.json({ success: true, rma });
  } catch (err) { next(err); }
});

module.exports = router;
