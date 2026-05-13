const mongoose = require('mongoose');
const Product = require('./models/Product');
const { checkInventoryAlerts } = require('./routes/admin');
require('dotenv').config();

const sync = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const products = await Product.find();
    console.log(`Checking ${products.length} products for low stock alerts...`);
    
    for (const p of products) {
      await checkInventoryAlerts(p._id);
    }
    
    console.log('Inventory sync complete!');
    process.exit(0);
  } catch (err) {
    console.error('Sync failed:', err);
    process.exit(1);
  }
};

sync();
