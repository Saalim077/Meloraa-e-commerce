const nodemailer = require('nodemailer');
const { Settings } = require('../models/Extended');

const sendEmail = async ({ to, subject, html }) => {
  try {
    // 1. Fetch settings from DB
    let settings = await Settings.findOne();
    
    // 2. Determine transporter config
    let config;
    if (settings && settings.emailProvider === 'smtp' && settings.smtpHost) {
      config = {
        host: settings.smtpHost,
        port: settings.smtpPort || 587,
        auth: { 
          user: settings.smtpUser, 
          pass: settings.smtpPassword 
        },
        secure: settings.smtpPort === 465, // true for 465, false for other ports
      };
    } else {
      // Fallback to .env
      config = {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: { 
          user: process.env.EMAIL_USER, 
          pass: process.env.EMAIL_PASS 
        },
      };
    }

    const transporter = nodemailer.createTransport(config);

    // 3. Determine sender email
    const senderEmail = (settings && settings.email) || process.env.STORE_EMAIL || process.env.EMAIL_USER;
    const storeName = (settings && settings.storeName) || "LuxeStore";

    await transporter.sendMail({ 
      from: `"${storeName}" <${senderEmail}>`, 
      to, 
      subject, 
      html 
    });

    console.log(`Email sent to ${to}`);
    require('fs').appendFileSync('email-debug.log', `[${new Date().toISOString()}] SUCCESS: Email sent to ${to}\n`);
  } catch (err) {
    console.error('Email send failed:', err.message);
    require('fs').appendFileSync('email-debug.log', `[${new Date().toISOString()}] ERROR: ${err.message}\n`);
  }
};

module.exports = sendEmail;
