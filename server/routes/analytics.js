const express = require('express');
const router = express.Router();
const { Order } = require('../models/index');
const Product = require('../models/Product');
const User = require('../models/User');
const Return = require('../models/Return');
const { Review, InventoryAlert } = require('../models/Extended');
const { protect, authorize } = require('../middleware/auth');

// ─── GET Summary Analytics ────────────────────────────────────────────────────
router.get('/summary', protect, authorize('admin', 'staff'), async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalOrders, totalUsers, totalProducts,
      currentMonthOrders, lastMonthOrders,
      currentMonthRevenue, lastMonthRevenue,
      recentOrders, lowStockProducts,
      orderStatusBreakdown, topProducts,
      totalReturns,
    ] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Order.countDocuments({ createdAt: { $gte: startOfLastMonth, $lt: startOfMonth } }),
      Order.aggregate([{ $match: { createdAt: { $gte: startOfMonth }, paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.aggregate([{ $match: { createdAt: { $gte: startOfLastMonth, $lt: startOfMonth }, paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(5),
      Product.find({ stock: { $lte: 5 }, isActive: true }).select('name stock sku').limit(10),
      Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $unwind: '$items' },
        { $group: { _id: '$items.product', totalSold: { $sum: '$items.quantity' }, revenue: { $sum: '$items.total' } } },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
        { $unwind: '$product' },
        { $project: { name: '$product.name', sku: '$product.sku', totalSold: 1, revenue: 1 } },
      ]),
      Return.countDocuments(),
    ]);

    const totalRevenue = currentMonthRevenue[0]?.total || 0;
    const lastRevenue = lastMonthRevenue[0]?.total || 0;
    const revenueGrowth = lastRevenue > 0 ? Math.round(((totalRevenue - lastRevenue) / lastRevenue) * 100) : 100;
    const ordersGrowth = lastMonthOrders > 0 ? Math.round(((currentMonthOrders - lastMonthOrders) / lastMonthOrders) * 100) : 100;

    // Monthly sales for chart (last 7 months)
    const monthlySales = await Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 6, 1) } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({
      success: true,
      stats: {
        totalRevenue,
        totalOrders,
        totalUsers,
        totalProducts,
        totalReturns,
        avgOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
        revenueGrowth,
        ordersGrowth,
        currentMonthOrders,
      },
      recentOrders,
      lowStockProducts,
      orderStatusBreakdown,
      monthlySales,
      topProducts,
    });
  } catch (err) { next(err); }
});

// ─── GET Sales Trends (Advanced) ──────────────────────────────────────────────
router.get('/sales-trends', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const { days = 30, dateFrom = '', dateTo = '' } = req.query;
    const endDate = new Date();
    const startDate = dateFrom ? new Date(dateFrom) : new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    const adjustedEndDate = dateTo ? new Date(dateTo) : endDate;

    const trends = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: adjustedEndDate },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
          avgOrderValue: { $avg: '$total' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({ success: true, trends });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET Customer Insights ────────────────────────────────────────────────────
router.get('/customer-insights', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const [
      totalCustomers,
      newCustomersThisMonth,
      repeatCustomers,
      customerLifetimeValue,
      topCustomers,
      customerSegmentation
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } }),
      Order.aggregate([
        { $group: { _id: '$user', orderCount: { $sum: 1 } } },
        { $match: { orderCount: { $gt: 1 } } },
        { $count: 'total' }
      ]),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: '$user', totalSpent: { $sum: '$total' }, orderCount: { $sum: 1 } } },
        { $group: { _id: null, avgCLV: { $avg: '$totalSpent' }, maxCLV: { $max: '$totalSpent' } } }
      ]),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: '$user', totalSpent: { $sum: '$total' }, orderCount: { $sum: 1 } } },
        { $sort: { totalSpent: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $project: { name: '$user.name', email: '$user.email', totalSpent: 1, orderCount: 1 } }
      ]),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: '$user', totalSpent: { $sum: '$total' } } },
        { $bucketAuto: { groupBy: '$totalSpent', buckets: 5 } }
      ])
    ]);

    res.json({
      success: true,
      metrics: {
        totalCustomers,
        newCustomersThisMonth,
        repeatCustomersCount: repeatCustomers[0]?.total || 0,
        avgCLV: customerLifetimeValue[0]?.avgCLV || 0,
        maxCLV: customerLifetimeValue[0]?.maxCLV || 0
      },
      topCustomers,
      segmentation: customerSegmentation
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET Product Performance ──────────────────────────────────────────────────
router.get('/product-performance', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const topPerformers = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $project: {
          name: '$productInfo.name',
          sku: '$productInfo.sku',
          totalSold: 1,
          totalRevenue: 1,
          orders: 1,
          avgPrice: { $divide: ['$totalRevenue', '$totalSold'] }
        }
      }
    ]);

    const lowPerformers = await Product.find({ isActive: true })
      .select('name sku meta')
      .sort({ 'meta.purchases': 1 })
      .limit(10);

    res.json({
      success: true,
      topPerformers,
      lowPerformers
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET Conversion Rate ──────────────────────────────────────────────────────
router.get('/conversion-rate', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date(new Date().getTime() - days * 24 * 60 * 60 * 1000);

    const totalUsers = await User.countDocuments({ createdAt: { $gte: startDate } });
    const totalOrders = await Order.countDocuments({ createdAt: { $gte: startDate }, paymentStatus: 'paid' });
    const totalOrderedUsers = await Order.distinct('user', { createdAt: { $gte: startDate }, paymentStatus: 'paid' });

    const conversionRate = totalUsers > 0 ? Math.round((totalOrderedUsers.length / totalUsers) * 100) : 0;

    res.json({
      success: true,
      metrics: {
        totalNewUsers: totalUsers,
        totalPurchases: totalOrders,
        uniqueBuyers: totalOrderedUsers.length,
        conversionRate: `${conversionRate}%`,
        period: `${days} days`
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET Reviews Analytics ───────────────────────────────────────────────────
router.get('/reviews-analytics', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const [
      totalReviews,
      pendingReviews,
      approvedReviews,
      avgRating,
      ratingDistribution
    ] = await Promise.all([
      Review.countDocuments(),
      Review.countDocuments({ status: 'pending' }),
      Review.countDocuments({ status: 'approved' }),
      Review.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ]),
      Review.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: '$rating', count: { $sum: 1 } } },
        { $sort: { _id: -1 } }
      ])
    ]);

    res.json({
      success: true,
      metrics: {
        totalReviews,
        pendingReviews,
        approvedReviews,
        rejectedReviews: totalReviews - pendingReviews - approvedReviews,
        avgRating: avgRating[0]?.avgRating.toFixed(2) || 0
      },
      ratingDistribution
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── EXPORT Analytics Report ──────────────────────────────────────────────────
router.get('/export/report', protect, authorize('admin'), async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalOrders, totalUsers, totalProducts, currentMonthRevenue] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Order.aggregate([{ $match: { createdAt: { $gte: startOfMonth }, paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    ]);

    const totalRevenue = currentMonthRevenue[0]?.total || 0;

    let report = 'LuxeStore Analytics Report\n';
    report += `Generated: ${now.toISOString()}\n\n`;
    report += '=== SUMMARY ===\n';
    report += `Total Revenue (This Month): ₹${totalRevenue}\n`;
    report += `Total Orders: ${totalOrders}\n`;
    report += `Total Users: ${totalUsers}\n`;
    report += `Active Products: ${totalProducts}\n`;

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename="analytics-report.txt"');
    res.send(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
