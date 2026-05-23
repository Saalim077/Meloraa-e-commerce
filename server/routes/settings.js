const express = require('express');
const { Settings, EmailTemplate } = require('../models/Extended');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');

const router = express.Router();

// ─── GET Settings ─────────────────────────────────────────────────────────────
router.get('/', optionalAuth, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ email: 'admin@luxestore.com' });
    }
    // Don't expose sensitive data to non-admins
    if (!req.user || req.user.role !== 'admin') {
      const fullSettings = settings.toObject({ virtuals: true, getters: true, defaults: true });
      const { smtpPassword, stripeSecretKey, ...safeSettings } = fullSettings;
      return res.json(safeSettings);
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── UPDATE Settings (Admin Only) ──────────────────────────────────────────────
router.put('/', protect, authorize('admin'), async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = new Settings();

    // Allowed fields to update
    const allowedFields = [
      'storeName', 'storeDescription', 'logo', 'favicon', 'email', 'phone', 'address',
      'city', 'state', 'pincode', 'country', 'gstin', 'pan', 'emailProvider', 'smtpHost', 'smtpPort',
      'smtpUser', 'smtpPassword', 'stripePublicKey', 'stripeSecretKey',
      'shippingEnabled', 'standardShippingCost', 'freeShippingThreshold', 'shippingZones',
      'taxEnabled', 'taxInclusive', 'taxRate', 'taxLabel', 'taxClasses', 'itemsPerPage', 'currencySymbol', 'currencyCode', 'timezone',
      'commonAttributes', 'shopFilters', 'rmaPolicies', 'homepageBanners', 'testimonials', 'metaPixelId', 'googleAnalyticsId'
    ];

    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) settings[key] = req.body[key];
    });

    await settings.save();
    res.json({ message: 'Settings updated', settings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET Email Templates ──────────────────────────────────────────────────────
router.get('/email-templates', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const templates = await EmailTemplate.find().sort({ type: 1 });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── CREATE Email Template ────────────────────────────────────────────────────
router.post('/email-templates', protect, authorize('admin'), [
  body('name').trim().notEmpty().withMessage('Template name is required'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('template').notEmpty().withMessage('Template content is required'),
  body('type').optional().isIn(['order', 'user', 'notification', 'admin']).withMessage('Invalid template type'),
], validate, async (req, res) => {
  try {
    const { name, subject, template, variables, type } = req.body;

    const existing = await EmailTemplate.findOne({ name });
    if (existing) return res.status(400).json({ message: 'Template name already exists' });

    const emailTemplate = await EmailTemplate.create({ name, subject, template, variables, type });
    res.status(201).json({ message: 'Template created', emailTemplate });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── UPDATE Email Template ────────────────────────────────────────────────────
router.put('/email-templates/:id', protect, authorize('admin'), [
  param('id').isMongoId().withMessage('Invalid template ID'),
], validate, async (req, res) => {
  try {
    const { subject, template, variables, isActive } = req.body;

    const emailTemplate = await EmailTemplate.findByIdAndUpdate(
      req.params.id,
      { subject, template, variables, isActive },
      { new: true }
    );

    if (!emailTemplate) return res.status(404).json({ message: 'Template not found' });
    res.json({ message: 'Template updated', emailTemplate });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── DELETE Email Template ────────────────────────────────────────────────────
router.delete('/email-templates/:id', protect, authorize('admin'), [
  param('id').isMongoId().withMessage('Invalid template ID'),
], validate, async (req, res) => {
  try {
    const emailTemplate = await EmailTemplate.findByIdAndDelete(req.params.id);
    if (!emailTemplate) return res.status(404).json({ message: 'Template not found' });
    res.json({ message: 'Template deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
