const { EmailTemplate } = require('../models/Extended');

const seedDefaultTemplates = async () => {
  try {
    const defaultTemplates = [
      {
        name: 'admin_new_order',
        subject: 'New Order Received - #{{orderIdShort}}',
        variables: ['orderId', 'orderIdShort', 'customerName', 'customerEmail', 'total', 'paymentMethod', 'clientUrl'],
        type: 'admin',
        isActive: true,
        template: `
          <div style="max-width:600px;margin:0 auto;background:#0f0e0d;font-family:'Helvetica Neue',Arial,sans-serif;padding:32px;">
            <h1 style="color:#d4af37;letter-spacing:4px;text-align:center;font-size:24px;margin-bottom:24px;">NEW ORDER RECEIVED</h1>
            <div style="background:#1a1917;border:1px solid #33312e;border-radius:8px;padding:24px;">
              <p style="color:#e8e0d0;margin:0 0 12px;"><strong style="color:#d4af37;">Order Number:</strong> #{{orderIdShort}}</p>
              <p style="color:#e8e0d0;margin:0 0 12px;"><strong style="color:#d4af37;">Customer:</strong> {{customerName}} &lt;{{customerEmail}}&gt;</p>
              <p style="color:#e8e0d0;margin:0 0 12px;"><strong style="color:#d4af37;">Total Amount:</strong> ₹{{total}}</p>
              <p style="color:#e8e0d0;margin:0;"><strong style="color:#d4af37;">Payment Method:</strong> {{paymentMethod}}</p>
            </div>
            <div style="text-align:center;margin-top:32px;">
              <a href="{{clientUrl}}/admin/orders" style="background:#d4af37;color:#0f0e0d;padding:12px 28px;text-decoration:none;border-radius:4px;font-weight:700;display:inline-block;text-transform:uppercase;letter-spacing:1px;">View in Admin Panel</a>
            </div>
          </div>
        `
      },
      {
        name: 'admin_order_cancelled',
        subject: 'Order Cancelled Alert - #{{orderIdShort}}',
        variables: ['orderId', 'orderIdShort', 'customerName', 'customerEmail', 'total', 'clientUrl'],
        type: 'admin',
        isActive: true,
        template: `
          <div style="max-width:600px;margin:0 auto;background:#0f0e0d;font-family:'Helvetica Neue',Arial,sans-serif;padding:32px;">
            <h1 style="color:#ff4d4d;letter-spacing:4px;text-align:center;font-size:24px;margin-bottom:24px;">ORDER CANCELLED</h1>
            <div style="background:#1a1917;border:1px solid #33312e;border-radius:8px;padding:24px;">
              <p style="color:#e8e0d0;margin:0 0 12px;"><strong style="color:#ff4d4d;">Order Number:</strong> #{{orderIdShort}}</p>
              <p style="color:#e8e0d0;margin:0 0 12px;"><strong style="color:#d4af37;">Customer:</strong> {{customerName}} &lt;{{customerEmail}}&gt;</p>
              <p style="color:#e8e0d0;margin:0;"><strong style="color:#d4af37;">Total Amount:</strong> ₹{{total}}</p>
            </div>
            <div style="text-align:center;margin-top:32px;">
              <a href="{{clientUrl}}/admin/orders" style="background:#ff4d4d;color:#ffffff;padding:12px 28px;text-decoration:none;border-radius:4px;font-weight:700;display:inline-block;text-transform:uppercase;letter-spacing:1px;">View in Admin Panel</a>
            </div>
          </div>
        `
      },
      {
        name: 'admin_refund_requested',
        subject: 'Return Request Received - Order #{{orderIdShort}}',
        variables: ['orderId', 'orderIdShort', 'customerName', 'customerEmail', 'returnReason', 'reasonDetails', 'clientUrl', 'returnUrl'],
        type: 'admin',
        isActive: true,
        template: `
          <div style="max-width:600px;margin:0 auto;background:#0f0e0d;font-family:'Helvetica Neue',Arial,sans-serif;padding:32px;">
            <h1 style="color:#d4af37;letter-spacing:4px;text-align:center;font-size:24px;margin-bottom:24px;">RETURN REQUEST</h1>
            <div style="background:#1a1917;border:1px solid #33312e;border-radius:8px;padding:24px;">
              <p style="color:#e8e0d0;margin:0 0 12px;"><strong style="color:#d4af37;">Order Number:</strong> #{{orderIdShort}}</p>
              <p style="color:#e8e0d0;margin:0 0 12px;"><strong style="color:#d4af37;">Customer:</strong> {{customerName}} &lt;{{customerEmail}}&gt;</p>
              <p style="color:#e8e0d0;margin:0 0 12px;"><strong style="color:#d4af37;">Reason:</strong> {{returnReason}}</p>
              <p style="color:#e8e0d0;margin:0;"><strong style="color:#d4af37;">Details:</strong> {{reasonDetails}}</p>
            </div>
            <div style="text-align:center;margin-top:32px;">
              <a href="{{returnUrl}}" style="background:#d4af37;color:#0f0e0d;padding:12px 28px;text-decoration:none;border-radius:4px;font-weight:700;display:inline-block;text-transform:uppercase;letter-spacing:1px;">Review Request</a>
            </div>
          </div>
        `
      },
      {
        name: 'admin_low_inventory',
        subject: 'Low Stock Alert: {{productName}}',
        variables: ['productName', 'sku', 'currentStock', 'threshold', 'alertType', 'clientUrl'],
        type: 'admin',
        isActive: true,
        template: `
          <div style="max-width:600px;margin:0 auto;background:#0f0e0d;font-family:'Helvetica Neue',Arial,sans-serif;padding:32px;">
            <h1 style="color:#d4af37;letter-spacing:4px;text-align:center;font-size:24px;margin-bottom:24px;">LOW INVENTORY ALERT</h1>
            <div style="background:#1a1917;border:1px solid #33312e;border-radius:8px;padding:24px;">
              <p style="color:#e8e0d0;margin:0 0 12px;"><strong style="color:#d4af37;">Product:</strong> {{productName}}</p>
              <p style="color:#e8e0d0;margin:0 0 12px;"><strong style="color:#d4af37;">SKU:</strong> {{sku}}</p>
              <p style="color:#e8e0d0;margin:0 0 12px;"><strong style="color:#d4af37;">Current Stock:</strong> <span style="color:#ff4d4d;font-weight:700;">{{currentStock}}</span></p>
              <p style="color:#e8e0d0;margin:0 0 12px;"><strong style="color:#d4af37;">Threshold:</strong> {{threshold}}</p>
              <p style="color:#e8e0d0;margin:0;"><strong style="color:#d4af37;">Alert Type:</strong> {{alertType}}</p>
            </div>
            <div style="text-align:center;margin-top:32px;">
              <a href="{{clientUrl}}/admin/inventory" style="background:#d4af37;color:#0f0e0d;padding:12px 28px;text-decoration:none;border-radius:4px;font-weight:700;display:inline-block;text-transform:uppercase;letter-spacing:1px;">Manage Inventory</a>
            </div>
          </div>
        `
      },
      {
        name: 'refund_requested',
        subject: 'Return Request Received - Order #{{orderIdShort}}',
        variables: ['userName', 'orderId', 'orderIdShort', 'returnReason', 'clientUrl'],
        type: 'order',
        isActive: true,
        template: `
          <div style="max-width:600px;margin:0 auto;background:#0f0e0d;font-family:'Helvetica Neue',Arial,sans-serif;padding:32px;">
            <h1 style="color:#d4af37;letter-spacing:4px;text-align:center;font-size:24px;margin-bottom:24px;">RETURN REQUEST RECEIVED</h1>
            <div style="background:#1a1917;border:1px solid #33312e;border-radius:8px;padding:24px;">
              <p style="color:#e8e0d0;margin:0 0 12px;">Hello {{userName}},</p>
              <p style="color:#b3aea6;line-height:1.6;margin:0 0 20px;">We have received your return/refund request for order #{{orderIdShort}}.</p>
              <div style="background:#0f0e0d;border:1px dashed #33312e;padding:16px;border-radius:6px;margin-bottom:20px;">
                <p style="color:#e8e0d0;margin:0 0 8px;"><strong style="color:#d4af37;">Order:</strong> #{{orderIdShort}}</p>
                <p style="color:#e8e0d0;margin:0;"><strong style="color:#d4af37;">Reason:</strong> {{returnReason}}</p>
              </div>
              <p style="color:#b3aea6;line-height:1.6;margin:0;">Our concierge team will review your request and get back to you with shipping instructions within 24-48 hours.</p>
            </div>
            <div style="text-align:center;margin-top:32px;">
              <a href="{{clientUrl}}/profile" style="background:#d4af37;color:#0f0e0d;padding:12px 28px;text-decoration:none;border-radius:4px;font-weight:700;display:inline-block;text-transform:uppercase;letter-spacing:1px;">Track Request</a>
            </div>
          </div>
        `
      },
      {
        name: 'user_registration_otp',
        subject: 'Verify Your LuxeStore Account - {{otp}}',
        variables: ['userName', 'otp', 'email'],
        type: 'user',
        isActive: true,
        template: `
          <div style="max-width:600px;margin:0 auto;background:#0f0e0d;font-family:'Helvetica Neue',Arial,sans-serif;padding:32px;">
            <h1 style="color:#d4af37;letter-spacing:4px;text-align:center;font-size:24px;margin-bottom:24px;">LUXESTORE</h1>
            <div style="background:#1a1917;border:1px solid #33312e;border-radius:8px;padding:24px;text-align:center;">
              <p style="color:#e8e0d0;margin:0 0 12px;">Hello {{userName}},</p>
              <p style="color:#b3aea6;line-height:1.6;margin:0 0 24px;">Your One-Time Password (OTP) for account verification is:</p>
              <div style="margin:24px auto;max-width:200px;padding:16px;background:#0f0e0d;border:1px solid #33312e;border-radius:8px;font-size:32px;font-weight:700;letter-spacing:8px;color:#d4af37;">
                {{otp}}
              </div>
              <p style="color:#6b665e;font-size:12px;margin:24px 0 0;">This OTP is valid for 10 minutes. If you did not request this code, please ignore this email.</p>
            </div>
          </div>
        `
      }
    ];

    for (const t of defaultTemplates) {
      const exists = await EmailTemplate.findOne({ name: t.name });
      if (!exists) {
        await EmailTemplate.create(t);
        console.log(`[SEED] Created default template: ${t.name}`);
      } else if (exists.type !== t.type) {
        exists.type = t.type;
        await exists.save();
        console.log(`[SEED] Updated existing template ${t.name} type to '${t.type}'`);
      }
    }
  } catch (err) {
    console.error('[SEED ERROR] Failed to seed default templates:', err.message);
  }
};

module.exports = { seedDefaultTemplates };
