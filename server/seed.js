const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Product = require('./models/Product');
const { Category, Coupon, Order, Return } = require('./models/index');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing
    await Promise.all([
      User.deleteMany(),
      Product.deleteMany(),
      Category.deleteMany(),
      Coupon.deleteMany(),
      Order.deleteMany(),
      Return.deleteMany(),
    ]);
    console.log('🗑️  Cleared existing data');

    // Admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@luxestore.com',
      password: 'Admin@123',
      role: 'admin',
      emailVerified: true,
    });
    console.log('👤 Admin created: admin@luxestore.com / Admin@123');

    // Categories
    const cats = await Category.insertMany([
      { name: 'Apparel', slug: 'apparel', description: 'Luxury clothing & fashion', image: '👗', isActive: true, order: 1 },
      { name: 'Accessories', slug: 'accessories', description: 'Premium bags, belts & more', image: '👜', isActive: true, order: 2 },
      { name: 'Beauty', slug: 'beauty', description: 'Skincare, fragrances & cosmetics', image: '✨', isActive: true, order: 3 },
      { name: 'Jewellery', slug: 'jewellery', description: 'Fine jewellery & watches', image: '💎', isActive: true, order: 4 },
      { name: 'Footwear', slug: 'footwear', description: 'Designer shoes & heels', image: '👠', isActive: true, order: 5 },
      { name: 'Home', slug: 'home', description: 'Luxury home decor & gifting', image: '🏡', isActive: true, order: 6 },
    ]);
    console.log('📁 6 categories created');

    // Products
    const products = [
      { name: 'Versailles Silk Blouse', sku: 'VSB-001', brand: 'Maison Élite', price: 8500, comparePrice: 12000, stock: 24, category: cats[0]._id, isNew: true, isFeatured: true, shortDescription: 'Pure silk blouse with hand-finished embroidery', tags: ['silk', 'blouse', 'luxury'], isActive: true },
      { name: 'Noir Satin Slip Dress', sku: 'NSD-002', brand: 'Maison Élite', price: 15000, comparePrice: 22000, stock: 12, category: cats[0]._id, isOnSale: true, isFeatured: true, shortDescription: 'Fluid satin dress for evening elegance', tags: ['dress', 'satin', 'evening'], isActive: true },
      { name: 'Cashmere Overcoat', sku: 'CCO-003', brand: 'Atelier Nord', price: 24000, comparePrice: 35000, stock: 3, category: cats[0]._id, isFeatured: true, shortDescription: 'Pure cashmere double-breasted coat', tags: ['coat', 'cashmere', 'winter'], isActive: true },
      { name: 'Ivory Linen Blazer', sku: 'ILB-004', brand: 'Atelier Nord', price: 11500, comparePrice: 0, stock: 18, category: cats[0]._id, isNew: true, shortDescription: 'Tailored linen blazer in ivory white', tags: ['blazer', 'linen', 'tailored'], isActive: true },
      { name: 'Onyx Leather Tote', sku: 'OLT-005', brand: 'LeatherCraft', price: 12500, comparePrice: 18000, stock: 8, category: cats[1]._id, isFeatured: true, isOnSale: true, shortDescription: 'Hand-stitched full-grain leather tote', tags: ['tote', 'leather', 'bag'], isActive: true },
      { name: 'Gold Chain Belt', sku: 'GCB-006', brand: 'LeatherCraft', price: 4200, comparePrice: 6000, stock: 30, category: cats[1]._id, isNew: true, shortDescription: 'Layered gold-tone chain waist belt', tags: ['belt', 'gold', 'chain'], isActive: true },
      { name: 'Pearl Clasp Clutch', sku: 'PCC-007', brand: 'LeatherCraft', price: 7800, comparePrice: 11000, stock: 6, category: cats[1]._id, isFeatured: true, shortDescription: 'Satin evening clutch with pearl clasp', tags: ['clutch', 'pearl', 'evening'], isActive: true },
      { name: 'Amber Parfum 50ml', sku: 'APF-008', brand: 'Essence Luxe', price: 5999, comparePrice: 8500, stock: 0, category: cats[2]._id, isOnSale: true, shortDescription: 'Warm amber & oud fragrance, 50ml', tags: ['perfume', 'amber', 'oud'], isActive: true },
      { name: 'Rose Gold Face Serum', sku: 'RGS-009', brand: 'Essence Luxe', price: 3200, comparePrice: 4500, stock: 45, category: cats[2]._id, isNew: true, isFeatured: true, shortDescription: '24K gold & hyaluronic acid brightening serum', tags: ['serum', 'skincare', 'gold'], isActive: true },
      { name: 'Velvet Lip Collection', sku: 'VLC-010', brand: 'Essence Luxe', price: 2400, comparePrice: 3200, stock: 60, category: cats[2]._id, isNew: true, shortDescription: 'Set of 3 matte velvet lip colours', tags: ['lipstick', 'velvet', 'set'], isActive: true },
      { name: 'Diamond Stud Earrings', sku: 'DSE-011', brand: 'Lumière Fine', price: 45000, comparePrice: 60000, stock: 2, category: cats[3]._id, isFeatured: true, shortDescription: '0.5 carat certified diamond studs, 18K gold', tags: ['diamond', 'earrings', 'gold'], isActive: true },
      { name: 'Crystal Pendant Necklace', sku: 'CPN-012', brand: 'Lumière Fine', price: 6750, comparePrice: 9000, stock: 15, category: cats[3]._id, isNew: true, shortDescription: 'Swarovski crystal pendant on gold chain', tags: ['necklace', 'crystal', 'pendant'], isActive: true },
      { name: 'Sapphire Cocktail Ring', sku: 'SCR-013', brand: 'Lumière Fine', price: 22000, comparePrice: 30000, stock: 5, category: cats[3]._id, isFeatured: true, isOnSale: true, shortDescription: 'Natural sapphire set in white gold band', tags: ['ring', 'sapphire', 'cocktail'], isActive: true },
      { name: 'Kitten Heel Mules', sku: 'KHM-014', brand: 'Vogue Steps', price: 9500, comparePrice: 14000, stock: 20, category: cats[4]._id, isNew: true, isFeatured: true, shortDescription: 'Italian leather kitten heel mules', tags: ['heels', 'mules', 'leather'], isActive: true },
      { name: 'Block Heel Pumps', sku: 'BHP-015', brand: 'Vogue Steps', price: 7800, comparePrice: 11000, stock: 14, category: cats[4]._id, isOnSale: true, shortDescription: 'Suede block heel court shoes', tags: ['pumps', 'heels', 'suede'], isActive: true },
      { name: 'Silk Lounge Set', sku: 'SLS-016', brand: 'Casa Luxe', price: 18500, comparePrice: 25000, stock: 8, category: cats[5]._id, isFeatured: true, shortDescription: 'Silk pillowcase and eye mask gift set', tags: ['silk', 'sleep', 'gift'], isActive: true },
      { name: 'Marble Candle Collection', sku: 'MCC-017', brand: 'Casa Luxe', price: 4500, comparePrice: 6000, stock: 35, category: cats[5]._id, isNew: true, shortDescription: 'Set of 3 soy wax candles in marble vessels', tags: ['candle', 'marble', 'home'], isActive: true },
      { name: 'Velvet Throw Blanket', sku: 'VTB-018', brand: 'Casa Luxe', price: 8900, comparePrice: 12000, stock: 10, category: cats[5]._id, isFeatured: true, shortDescription: 'Double-sided velvet throw in deep jewel tones', tags: ['blanket', 'velvet', 'home'], isActive: true },
      { name: 'Gold Cuff Bracelet', sku: 'GCB-019', brand: 'Lumière Fine', price: 3800, comparePrice: 5500, stock: 22, category: cats[3]._id, isNew: true, shortDescription: 'Hammered gold-tone open cuff bracelet', tags: ['bracelet', 'cuff', 'gold'], isActive: true },
      { name: 'Pleated Midi Skirt', sku: 'PMS-020', brand: 'Maison Élite', price: 6200, comparePrice: 9000, stock: 16, category: cats[0]._id, isOnSale: true, isFeatured: true, shortDescription: 'Pleated chiffon midi skirt in champagne', tags: ['skirt', 'pleated', 'chiffon'], isActive: true },
    ];

    for (const p of products) {
      p.slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      p.meta = { views: Math.floor(Math.random() * 500), purchases: Math.floor(Math.random() * 100), ratings: [], averageRating: (3.5 + Math.random() * 1.5).toFixed(1) };
    }
    const createdProducts = await Product.insertMany(products);
    console.log('📦 20 products created');

    // Coupons
    await Coupon.insertMany([
      { code: 'LUXE20', type: 'percentage', value: 20, minPurchase: 2000, maxDiscount: 5000, usageLimit: 100, usedCount: 45, startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31'), isActive: true },
      { code: 'FLAT500', type: 'fixed', value: 500, minPurchase: 1500, usageLimit: 200, usedCount: 120, endDate: new Date('2024-12-31'), isActive: true },
      { code: 'NEWUSER', type: 'percentage', value: 15, minPurchase: 1000, usageLimit: 500, usedCount: 89, endDate: new Date('2025-12-31'), isActive: true },
    ]);
    console.log('🎟️  3 coupons created');

    // Sample Customer
    const customer = await User.create({
      name: 'Priya Sharma',
      email: 'priya@example.com',
      password: 'User@123',
      role: 'user',
      emailVerified: true,
      addresses: [{
        type: 'shipping',
        firstName: 'Priya', lastName: 'Sharma',
        phone: '9876543210', email: 'priya@example.com',
        address: '123 Luxury Lane, Juhu',
        addressLine1: '123 Luxury Lane', city: 'Mumbai', state: 'Maharashtra', zipCode: '400049'
      }]
    });

    // Sample Orders
    const order1 = await Order.create({
      user: customer._id,
      items: [{ product: createdProducts[0]._id, quantity: 1, price: 8500, total: 8500 }],
      subtotal: 8500, total: 8500,
      orderStatus: 'delivered', paymentStatus: 'paid',
      shippingAddress: customer.addresses[0],
      billingAddress: customer.addresses[0],
      deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago (eligible)
    });

    const order2 = await Order.create({
      user: customer._id,
      items: [{ product: createdProducts[1]._id, quantity: 1, price: 15000, total: 15000 }],
      subtotal: 15000, total: 15000,
      orderStatus: 'delivered', paymentStatus: 'paid',
      shippingAddress: customer.addresses[0],
      deliveredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago (expired)
    });

    // Sample Return (RMA)
    const orderToReturn = await Order.findOne({ user: customer._id, orderStatus: 'delivered' });
    if (orderToReturn) {
        await Return.create({
          order: orderToReturn._id,
          user: customer._id,
          type: 'return',
          reason: 'changed_mind',
          items: [{
            product: orderToReturn.items[0].product,
            orderItem: orderToReturn.items[0]._id,
            quantity: 1,
            price: orderToReturn.items[0].price,
            condition: 'unopened'
          }],
          pickupAddress: customer.addresses[0].toObject()
        });
        orderToReturn.orderStatus = 'Refund Requested';
        orderToReturn.returnStatus = 'requested';
        await orderToReturn.save();
    }

    console.log('📦 Sample orders and RMA created');

    console.log('\n✅ Seed complete!');
    console.log('─────────────────────────────');
    console.log('Admin: admin@luxestore.com');
    console.log('Password: Admin@123');
    console.log('─────────────────────────────');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
};

seed();
