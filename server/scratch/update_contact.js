const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Settings } = require('../models/Extended');

async function run() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌ MONGO_URI is missing in environment variables');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');

  let settings = await Settings.findOne();
  if (!settings) {
    console.log('Settings document not found, creating a new one...');
    settings = new Settings({ email: 'admin@luxestore.com' });
  }
  
  settings.contactPhone = '+91 97799720364';
  settings.contactEmail = 'help@shopmeloraa.com';
  
  await settings.save();
  console.log('🎉 Store settings updated successfully with phone: +91 97799720364 and email: help@shopmeloraa.com!');
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Error updating settings:', err);
  process.exit(1);
});
