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
        port: Number(settings.smtpPort) || 587,
        auth: { 
          user: settings.smtpUser, 
          pass: settings.smtpPassword 
        },
        secure: Number(settings.smtpPort) === 465,
        tls: {
          rejectUnauthorized: false
        }
      };
    } else {
      // Fallback to .env
      config = {
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT) || 587,
        auth: { 
          user: process.env.EMAIL_USER, 
          pass: process.env.EMAIL_PASS 
        },
        secure: Number(process.env.EMAIL_PORT) === 465,
        tls: {
          rejectUnauthorized: false
        }
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

    console.log(`[EMAIL] SUCCESS: Email sent to ${to}`);
  } catch (err) {
    console.error('[EMAIL] Failed:', err.message);
  }
};

module.exports = sendEmail;
