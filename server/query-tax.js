const mongoose = require('mongoose');
const { Settings } = require('./models/Extended');
const { Order } = require('./models/index');
const Product = require('./models/Product');
require('dotenv').config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('CONNECTED');

  const settings = await Settings.findOne();
  console.log('--- SETTINGS ---');
  console.log(JSON.stringify(settings, null, 2));

  const product = await Product.findOne({ name: /gingham/i });
  console.log('--- PRODUCT ---');
  console.log(JSON.stringify(product, null, 2));

  const order = await Order.findOne({ total: 1416 });
  console.log('--- ORDER 1416 ---');
  console.log(JSON.stringify(order, null, 2));

  const anyOrder = await Order.findOne().sort({ createdAt: -1 });
  console.log('--- LATEST ORDER ---');
  console.log(JSON.stringify(anyOrder, null, 2));

  process.exit(0);
};

run().catch(err => {
  console.error(err);
  process.exit(1);
});
