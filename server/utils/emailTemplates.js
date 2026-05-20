const { EmailTemplate } = require('../models/Extended');
const { parseTemplate } = require('./templateParser');

const baseTemplate = (content, title) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0f0e0d; color: #e8e0d0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    .container { max-width: 600px; margin: 0 auto; background-color: #0f0e0d; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 40px; }
    .logo { color: #d4af37; font-size: 28px; font-weight: 700; letter-spacing: 4px; text-decoration: none; text-transform: uppercase; }
    .content-box { background-color: #1a1917; border: 1px solid #33312e; border-radius: 8px; padding: 40px; margin-bottom: 30px; }
    .title { color: #ffffff; font-size: 22px; font-weight: 400; margin-top: 0; margin-bottom: 24px; letter-spacing: 1px; text-align: center; }
    .text { color: #b3aea6; font-size: 15px; line-height: 1.6; margin-bottom: 24px; text-align: center; }
    .btn-container { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background-color: #d4af37; color: #0f0e0d; text-decoration: none; padding: 14px 36px; border-radius: 4px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
    .details-box { background-color: #0f0e0d; border: 1px dashed #33312e; padding: 20px; border-radius: 6px; margin-bottom: 24px; }
    .details-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
    .details-row:last-child { margin-bottom: 0; }
    .details-label { color: #b3aea6; }
    .details-value { color: #ffffff; font-weight: 500; }
    .footer { text-align: center; padding-top: 30px; border-top: 1px solid #33312e; }
    .footer-text { color: #6b665e; font-size: 12px; line-height: 1.5; margin: 0; }
    .social-links { margin-top: 16px; }
    .social-links a { color: #d4af37; text-decoration: none; margin: 0 10px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
    .highlight { color: #d4af37; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="#" class="logo" style="color: #d4af37; font-size: 28px; font-weight: 700; letter-spacing: 4px; text-decoration: none; text-transform: uppercase;">LuxeStore</a>
    </div>
    <div class="content-box">
      ${content}
    </div>
    <div class="footer">
      <p class="footer-text">This email was sent by LuxeStore.<br>If you have any questions, please contact our concierge team.</p>
      <div class="social-links">
        <a href="#" style="color: #d4af37; text-decoration: none; margin: 0 10px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Instagram</a>
        <a href="#" style="color: #d4af37; text-decoration: none; margin: 0 10px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Twitter</a>
        <a href="#" style="color: #d4af37; text-decoration: none; margin: 0 10px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Pinterest</a>
      </div>
    </div>
  </div>
</body>
</html>
`;

const buildOrderSummaryHTML = (order) => {
  return `
    <div class="details-box">
      <div class="details-row">
        <span class="details-label">Order Number:</span>
        <span class="details-value">#${order._id.toString().slice(-6).toUpperCase()}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Order Date:</span>
        <span class="details-value">${new Date(order.createdAt).toLocaleDateString()}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Order Total:</span>
        <span class="details-value highlight">₹${order.total.toLocaleString()}</span>
      </div>
    </div>
  `;
};

module.exports = {
  buildShippedEmail: async (order) => {
    const tmpl = await EmailTemplate.findOne({ name: 'order_shipped', isActive: true });
    if (tmpl) {
      const templateData = {
        userName: order.shippingAddress?.firstName || order.user?.name || 'Customer',
        orderId: order.orderNumber || order._id.toString(),
        orderIdShort: (order.orderNumber || order._id.toString()).substring(0, 8).toUpperCase(),
        trackingNumber: order.trackingNumber || 'Pending',
        total: order.total?.toLocaleString('en-IN') || 0,
        clientUrl: process.env.CLIENT_URL || 'http://localhost:3000'
      };
      return { subject: parseTemplate(tmpl.subject, templateData), html: parseTemplate(tmpl.template, templateData) };
    }

    const trackingHtml = order.trackingNumber ? `
      <p class="text">Your tracking number is: <span class="highlight" style="font-weight: 700;">${order.trackingNumber}</span></p>
    ` : `<p class="text">Your package is on its way. We will update you once it arrives.</p>`;

    const content = `
      <h1 class="title">Your Order Has Shipped</h1>
      <p class="text">Great news! Your LuxeStore order has been carefully packaged and handed over to our shipping partners.</p>
      ${trackingHtml}
      ${buildOrderSummaryHTML(order)}
      <div class="btn-container">
        <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/profile" class="btn" style="display: inline-block; background-color: #d4af37; color: #0f0e0d; text-decoration: none; padding: 14px 36px; border-radius: 4px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">View Order Status</a>
      </div>
    `;
    return { subject: 'Your LuxeStore Order Has Shipped', html: baseTemplate(content, 'Order Shipped') };
  },

  buildDeliveredEmail: async (order) => {
    const tmpl = await EmailTemplate.findOne({ name: 'order_delivered', isActive: true });
    if (tmpl) {
      const templateData = {
        userName: order.shippingAddress?.firstName || order.user?.name || 'Customer',
        orderId: order.orderNumber || order._id.toString(),
        orderIdShort: (order.orderNumber || order._id.toString()).substring(0, 8).toUpperCase(),
        total: order.total?.toLocaleString('en-IN') || 0,
        clientUrl: process.env.CLIENT_URL || 'http://localhost:3000'
      };
      return { subject: parseTemplate(tmpl.subject, templateData), html: parseTemplate(tmpl.template, templateData) };
    }

    const content = `
      <h1 class="title">Your Order Has Arrived</h1>
      <p class="text">Your LuxeStore package has been successfully delivered. We hope you love your new luxury pieces.</p>
      ${buildOrderSummaryHTML(order)}
      <div class="btn-container">
        <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/profile" class="btn" style="display: inline-block; background-color: #d4af37; color: #0f0e0d; text-decoration: none; padding: 14px 36px; border-radius: 4px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Write a Review</a>
      </div>
      <p class="text" style="font-size: 13px; margin-top: 30px;">If you haven't received your package, please contact our concierge team immediately.</p>
    `;
    return { subject: 'Your LuxeStore Order Delivered', html: baseTemplate(content, 'Order Delivered') };
  },

  buildCancelledEmail: async (order) => {
    const tmpl = await EmailTemplate.findOne({ name: 'order_cancelled', isActive: true });
    if (tmpl) {
      const templateData = {
        userName: order.shippingAddress?.firstName || order.user?.name || 'Customer',
        orderId: order.orderNumber || order._id.toString(),
        orderIdShort: (order.orderNumber || order._id.toString()).substring(0, 8).toUpperCase(),
        total: order.total?.toLocaleString('en-IN') || 0,
        clientUrl: process.env.CLIENT_URL || 'http://localhost:3000'
      };
      return { subject: parseTemplate(tmpl.subject, templateData), html: parseTemplate(tmpl.template, templateData) };
    }

    const content = `
      <h1 class="title">Order Cancelled</h1>
      <p class="text">As requested, your LuxeStore order has been cancelled.</p>
      <p class="text">If you have already paid for this order, a full refund will be initiated to your original payment method within 3-5 business days.</p>
      ${buildOrderSummaryHTML(order)}
      <div class="btn-container">
        <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/shop" class="btn" style="display: inline-block; background-color: #d4af37; color: #0f0e0d; text-decoration: none; padding: 14px 36px; border-radius: 4px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Continue Shopping</a>
      </div>
    `;
    return { subject: 'LuxeStore Order Cancellation Confirmation', html: baseTemplate(content, 'Order Cancelled') };
  },

  buildRefundRequestedEmail: async (order) => {
    const tmpl = await EmailTemplate.findOne({ name: 'refund_requested', isActive: true });
    if (tmpl) {
      const templateData = {
        userName: order.shippingAddress?.firstName || order.user?.name || 'Customer',
        orderId: order.orderNumber || order._id.toString(),
        orderIdShort: (order.orderNumber || order._id.toString()).substring(0, 8).toUpperCase(),
        returnReason: order.returnReason || 'Not specified',
        clientUrl: process.env.CLIENT_URL || 'http://localhost:3000'
      };
      return { subject: parseTemplate(tmpl.subject, templateData), html: parseTemplate(tmpl.template, templateData) };
    }

    const content = `
      <h1 class="title">Return Request Received</h1>
      <p class="text">We have received your return request for the following order.</p>
      <div class="details-box">
        <div class="details-row"><span class="details-label">Order:</span> <span class="details-value">#${order._id.toString().slice(-6).toUpperCase()}</span></div>
        <div class="details-row"><span class="details-label">Reason:</span> <span class="details-value">${order.returnReason || 'Not specified'}</span></div>
      </div>
      <p class="text">Our concierge team will review your request and get back to you with shipping instructions within 24-48 hours.</p>
      <div class="btn-container">
        <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/returns/${order._id}" class="btn" style="display: inline-block; background-color: #d4af37; color: #0f0e0d; text-decoration: none; padding: 14px 36px; border-radius: 4px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Track Request</a>
      </div>
    `;
    return { subject: 'LuxeStore Return Request Received', html: baseTemplate(content, 'Return Request') };
  },

  buildRefundProcessedEmail: async (order) => {
    const tmpl = await EmailTemplate.findOne({ name: 'refund_completed', isActive: true });
    if (tmpl) {
      const templateData = {
        userName: order.shippingAddress?.firstName || order.user?.name || 'Customer',
        orderId: order.orderNumber || order._id.toString(),
        orderIdShort: (order.orderNumber || order._id.toString()).substring(0, 8).toUpperCase(),
        refundAmount: order.refundAmount?.toLocaleString('en-IN') || order.total?.toLocaleString('en-IN') || 0,
        total: order.total?.toLocaleString('en-IN') || 0,
        clientUrl: process.env.CLIENT_URL || 'http://localhost:3000'
      };
      return { subject: parseTemplate(tmpl.subject, templateData), html: parseTemplate(tmpl.template, templateData) };
    }

    const amountHtml = order.refundAmount ? `
      <p class="text">A refund of <span class="highlight" style="font-weight: 700; font-size: 18px;">₹${order.refundAmount.toLocaleString()}</span> has been initiated to your original payment method.</p>
    ` : `
      <p class="text">Your refund has been initiated to your original payment method.</p>
    `;

    const content = `
      <h1 class="title">Refund Processed</h1>
      <p class="text">Your returned items have been inspected and your refund has been successfully approved.</p>
      ${amountHtml}
      <p class="text">Please note that it may take 5-7 business days for the funds to reflect in your account, depending on your bank.</p>
      ${buildOrderSummaryHTML(order)}
      <div class="btn-container">
        <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/shop" class="btn" style="display: inline-block; background-color: #d4af37; color: #0f0e0d; text-decoration: none; padding: 14px 36px; border-radius: 4px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Explore New Arrivals</a>
      </div>
    `;
    return { subject: 'LuxeStore Refund Confirmation', html: baseTemplate(content, 'Refund Processed') };
  },

  buildRefundApprovedEmail: async (order) => {
    const tmpl = await EmailTemplate.findOne({ name: 'refund_approved', isActive: true });
    if (tmpl) {
      const templateData = {
        userName: order.shippingAddress?.firstName || order.user?.name || 'Customer',
        orderId: order.orderNumber || order._id.toString(),
        orderIdShort: (order.orderNumber || order._id.toString()).substring(0, 8).toUpperCase(),
        refundAmount: order.refundAmount?.toLocaleString('en-IN') || order.total?.toLocaleString('en-IN') || 0,
        total: order.total?.toLocaleString('en-IN') || 0,
        clientUrl: process.env.CLIENT_URL || 'http://localhost:3000'
      };
      return { subject: parseTemplate(tmpl.subject, templateData), html: parseTemplate(tmpl.template, templateData) };
    }

    const content = `
      <h1 class="title">Return Request Approved</h1>
      <p class="text">Good news! Your return request has been approved.</p>
      <div class="details-box">
        <div class="details-row"><span class="details-label">Order:</span> <span class="details-value">#${order._id.toString().slice(-6).toUpperCase()}</span></div>
        <div class="details-row"><span class="details-label">Expected Refund:</span> <span class="details-value highlight">₹${(order.refundAmount || order.total).toLocaleString()}</span></div>
      </div>
      <p class="text">Our logistics partner will contact you shortly to schedule a pickup for the return items. Please ensure they are packed securely.</p>
      <div class="btn-container">
        <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/returns/${order._id}" class="btn" style="display: inline-block; background-color: #d4af37; color: #0f0e0d; text-decoration: none; padding: 14px 36px; border-radius: 4px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">View Status</a>
      </div>
    `;
    return { subject: 'LuxeStore Return Request Approved', html: baseTemplate(content, 'Return Approved') };
  }
};
