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
  
  settings.contactAddress = 'D-64, first floor Okhla Phase 1\nNew Delhi 110020';
  settings.contactMapUrl = 'https://maps.google.com/maps?q=D-64%2C%20first%20floor%20Okhla%20Phase%201%2CNew%20Delhi%20110020&t=&z=15&ie=UTF8&iwloc=&output=embed';
  
  await settings.save();
  console.log('🎉 Store settings updated successfully with default address and Google Maps location!');
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Error updating settings:', err);
  process.exit(1);
});
