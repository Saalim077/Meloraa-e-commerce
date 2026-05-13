const express = require('express');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');
const { createActivityLog } = require('./admin');
const { body } = require('express-validator');
const validate = require('../middleware/validate');

const router = express.Router();

// ─── BULK Update Prices ───────────────────────────────────────────────────────
router.put('/products/bulk/price', protect, authorize('admin'), [
  body('productIds').isArray({ min: 1 }).withMessage('At least one product ID is required'),
  body('productIds.*').isMongoId().withMessage('Invalid product ID'),
  body('priceAdjustment').isNumeric().withMessage('Price adjustment must be a number'),
  body('adjustmentType').isIn(['percentage', 'fixed']).withMessage('Adjustment type must be percentage or fixed'),
], validate, async (req, res) => {
  try {
    const { productIds, priceAdjustment, adjustmentType } = req.body; // adjustmentType: 'percentage' or 'fixed'

    const updated = [];
    for (const id of productIds) {
      const product = await Product.findById(id);
      if (!product) continue;

      const oldPrice = product.price;
      if (adjustmentType === 'percentage') {
        product.price = Math.round(product.price * (1 + priceAdjustment / 100));
      } else {
        product.price = Math.round(product.price + priceAdjustment);
      }

      await product.save();
      await createActivityLog(req.user.id, 'update', 'product', id, { 
        before: { price: oldPrice }, 
        after: { price: product.price } 
      });
      updated.push(product);
    }

    res.json({ message: `Updated prices for ${updated.length} products`, updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── BULK Update Status ────────────────────────────────────────────────────────
router.put('/products/bulk/status', protect, authorize('admin'), [
  body('productIds').isArray({ min: 1 }).withMessage('At least one product ID is required'),
  body('productIds.*').isMongoId().withMessage('Invalid product ID'),
  body('isActive').isBoolean().withMessage('isActive must be a boolean'),
], validate, async (req, res) => {
  try {
    const { productIds, isActive } = req.body;

    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { isActive }
    );

    for (const id of productIds) {
      await createActivityLog(req.user.id, 'update', 'product', id, {
        before: { isActive: !isActive },
        after: { isActive }
      });
    }

    res.json({ message: `Updated ${result.modifiedCount} products`, result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── BULK Update Stock ─────────────────────────────────────────────────────────
router.put('/products/bulk/stock', protect, authorize('admin'), [
  body('productIds').isArray({ min: 1 }).withMessage('At least one product ID is required'),
  body('productIds.*').isMongoId().withMessage('Invalid product ID'),
  body('stock').isInt().withMessage('Stock must be an integer'),
  body('adjustmentType').isIn(['set', 'add']).withMessage('Adjustment type must be set or add'),
], validate, async (req, res) => {
  try {
    const { productIds, stock, adjustmentType } = req.body; // adjustmentType: 'set' or 'add'

    const updated = [];
    for (const id of productIds) {
      const product = await Product.findById(id);
      if (!product) continue;

      const oldStock = product.stock;
      if (adjustmentType === 'add') {
        product.stock = Math.max(0, product.stock + stock);
      } else {
        product.stock = Math.max(0, stock);
      }

      await product.save();
      await createActivityLog(req.user.id, 'update', 'product', id, {
        before: { stock: oldStock },
        after: { stock: product.stock }
      });
      
      // Trigger inventory alert check
      const { checkInventoryAlerts } = require('./admin');
      await checkInventoryAlerts(id);
      
      updated.push(product);
    }

    res.json({ message: `Updated stock for ${updated.length} products`, updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── BULK Delete Products ──────────────────────────────────────────────────────
router.delete('/products/bulk', protect, authorize('admin'), [
  body('productIds').isArray({ min: 1 }).withMessage('At least one product ID is required'),
  body('productIds.*').isMongoId().withMessage('Invalid product ID'),
], validate, async (req, res) => {
  try {
    const { productIds } = req.body;

    for (const id of productIds) {
      await createActivityLog(req.user.id, 'delete', 'product', id);
    }

    const result = await Product.deleteMany({ _id: { $in: productIds } });
    res.json({ message: `Deleted ${result.deletedCount} products`, result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── EXPORT Products (CSV) ────────────────────────────────────────────────────
router.get('/products/export/csv', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const products = await Product.find().select('name sku price stock category isActive hasVariants variants');
    
    let csv = 'ID,Name,SKU,Price,Stock,Category,Status,Variant\n';
    for (const p of products) {
      if (p.hasVariants && p.variants && p.variants.length > 0) {
        for (const v of p.variants) {
          csv += `"${p._id}","${p.name}","${v.sku || p.sku}",${v.price || p.price},${v.stock || 0},"${p.category}","${p.isActive ? 'Active' : 'Inactive'}","${v.name}"\n`;
        }
      } else {
        csv += `"${p._id}","${p.name}","${p.sku}",${p.price},${p.stock},"${p.category}","${p.isActive ? 'Active' : 'Inactive'}","-"\n`;
      }
    }

    await createActivityLog(req.user.id, 'export', 'product', 'bulk');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── IMPORT Products (CSV) ────────────────────────────────────────────────────
router.post('/products/import/csv', protect, authorize('admin'), [
  body('csvData').notEmpty().withMessage('CSV data is required'),
], validate, async (req, res) => {
  try {
    const { csvData } = req.body; // CSV as string
    const lines = csvData.trim().split('\n');
    
    const imported = [];
    for (let i = 1; i < lines.length; i++) { // Skip header
      const parts = lines[i].split(',');
      if (parts.length < 5) continue;

      const product = await Product.create({
        name: parts[1].replace(/"/g, ''),
        sku: parts[2].replace(/"/g, ''),
        price: parseInt(parts[3]),
        stock: parseInt(parts[4]),
        isActive: parts[6] === 'true'
      });

      await createActivityLog(req.user.id, 'create', 'product', product._id);
      imported.push(product);
    }

    res.json({ message: `Imported ${imported.length} products`, imported });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
