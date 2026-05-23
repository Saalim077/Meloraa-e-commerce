const express = require('express');
const { ActivityLog, InventoryAlert, Settings } = require('../models/Extended');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');
const sendEmail = require('../utils/email');
const emailTemplates = require('../utils/emailTemplates');

const router = express.Router();

// ─── GET Activity Logs ────────────────────────────────────────────────────────
router.get('/', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const { page = 1, limit = 20, entity = '', action = '', dateFrom = '', dateTo = '' } = req.query;
    const filter = {};

    if (entity) filter.entity = entity;
    if (action) filter.action = action;
    
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = to;
      }
    }

    const logs = await ActivityLog
      .find(filter)
      .populate('admin', 'name email')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await ActivityLog.countDocuments(filter);

    res.json({
      logs,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── LOG Activity (Internal Function) ──────────────────────────────────────────
const createActivityLog = async (admin, action, entity, entityId, changes = {}, ip = '', userAgent = '') => {
  try {
    await ActivityLog.create({
      admin,
      action,
      entity,
      entityId,
      changes,
      ip,
      userAgent,
      status: 'success'
    });
  } catch (err) {
    console.error('Failed to create activity log:', err);
  }
};

// ─── GET Inventory Alerts ─────────────────────────────────────────────────────
router.get('/inventory/alerts', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const { page = 1, limit = 15, resolved = 'false', alertType = '' } = req.query;
    const filter = { resolved: resolved === 'true' };

    if (alertType) filter.alertType = alertType;

    const alerts = await InventoryAlert
      .find(filter)
      .populate('product', 'name sku stock')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await InventoryAlert.countDocuments(filter);

    res.json({
      alerts,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET All Inventory ────────────────────────────────────────────────────────
router.get('/inventory/all', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { sku: new RegExp(search, 'i') }
      ];
    }
    const products = await Product.find(query)
      .select('name sku price stock isActive category hasVariants variants')
      .populate('category', 'name')
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .sort({ stock: 1 });
      
    const total = await Product.countDocuments(query);
    res.json({
      products,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── CREATE Inventory Alert ───────────────────────────────────────────────────
const checkInventoryAlerts = async (productId) => {
  try {
    const product = await Product.findById(productId);
    if (!product) return;

    const lowStockThreshold = 5;
    
    // Check for existing alerts
    const existingLowAlert = await InventoryAlert.findOne({
      product: productId,
      alertType: 'low_stock',
      resolved: false
    });

    const existingOutAlert = await InventoryAlert.findOne({
      product: productId,
      alertType: 'out_of_stock',
      resolved: false
    });

    if (product.stock === 0) {
      if (!existingOutAlert) {
        const newAlert = await InventoryAlert.create({
          product: productId,
          alertType: 'out_of_stock',
          threshold: 0,
          currentStock: 0,
          notificationSent: false
        });
        // Send email notification safely (non-blocking)
        (async () => {
          try {
            const settings = await Settings.findOne() || {};
            const adminEmail = settings.email || process.env.ADMIN_EMAIL || process.env.STORE_EMAIL;
            if (adminEmail) {
              const emailData = await emailTemplates.buildAdminLowInventoryEmail(product, 'out_of_stock', 0, 0);
              await sendEmail({
                to: adminEmail,
                subject: emailData.subject,
                html: emailData.html
              });
              newAlert.notificationSent = true;
              await newAlert.save();
            }
          } catch (e) {
            console.error('Failed to send out of stock alert email:', e.message);
          }
        })();
      }
      // Resolve low stock alert if it exists
      if (existingLowAlert) {
        existingLowAlert.resolved = true;
        existingLowAlert.resolvedAt = new Date();
        await existingLowAlert.save();
      }
    } else if (product.stock <= lowStockThreshold) {
      if (!existingLowAlert) {
        const newAlert = await InventoryAlert.create({
          product: productId,
          alertType: 'low_stock',
          threshold: lowStockThreshold,
          currentStock: product.stock,
          notificationSent: false
        });
        // Send email notification safely (non-blocking)
        (async () => {
          try {
            const settings = await Settings.findOne() || {};
            const adminEmail = settings.email || process.env.ADMIN_EMAIL || process.env.STORE_EMAIL;
            if (adminEmail) {
              const emailData = await emailTemplates.buildAdminLowInventoryEmail(product, 'low_stock', product.stock, lowStockThreshold);
              await sendEmail({
                to: adminEmail,
                subject: emailData.subject,
                html: emailData.html
              });
              newAlert.notificationSent = true;
              await newAlert.save();
            }
          } catch (e) {
            console.error('Failed to send low stock alert email:', e.message);
          }
        })();
      } else {
        existingLowAlert.currentStock = product.stock;
        await existingLowAlert.save();
      }
      // Resolve out of stock alert if it exists
      if (existingOutAlert) {
        existingOutAlert.resolved = true;
        existingOutAlert.resolvedAt = new Date();
        await existingOutAlert.save();
      }
    } else {
      // Resolve all alerts
      if (existingLowAlert) {
        existingLowAlert.resolved = true;
        existingLowAlert.resolvedAt = new Date();
        await existingLowAlert.save();
      }
      if (existingOutAlert) {
        existingOutAlert.resolved = true;
        existingOutAlert.resolvedAt = new Date();
        await existingOutAlert.save();
      }
    }
  } catch (err) {
    console.error('Failed to check inventory alerts:', err);
  }
};

// ─── RESOLVE Inventory Alert ──────────────────────────────────────────────────
router.put('/inventory/alerts/:id/resolve', protect, authorize('admin'), async (req, res) => {
  try {
    const alert = await InventoryAlert.findByIdAndUpdate(
      req.params.id,
      { resolved: true, resolvedAt: new Date() },
      { new: true }
    );

    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    res.json({ message: 'Alert resolved', alert });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = {
  router,
  createActivityLog,
  checkInventoryAlerts
};
