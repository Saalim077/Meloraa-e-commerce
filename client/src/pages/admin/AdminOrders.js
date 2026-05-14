import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { orderAPI, settingsAPI } from '../../utils/api';
import RefundModal from '../../components/admin/RefundModal';
import '../../styles/adminOrders.css';

const fmtINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const STATUS_TABS = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'Refund Requested', 'refunded'];
const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'Refund Requested', 'refunded'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];
const PAYMENT_METHODS = ['all', 'cod', 'prepaid'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [activePaymentMethod, setActivePaymentMethod] = useState('all');
  const [updating, setUpdating] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [settings, setSettings] = useState(null);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await settingsAPI.getSettings();
      setSettings(res.data);
    } catch (e) { console.error('Settings fetch error', e); }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeTab !== 'all') params.status = activeTab;
      if (activePaymentMethod !== 'all') params.paymentMethod = activePaymentMethod;
      
      const res = await orderAPI.getAll(params);
      setOrders(res.data.orders);
    } catch {
      toast.error('Failed to load orders');
    } finally { setLoading(false); }
  }, [activeTab, activePaymentMethod]);

  useEffect(() => { load(); fetchSettings(); }, [load, fetchSettings]);

  const handleStatusUpdate = async (orderId, field, value) => {
    setUpdating(orderId);
    try {
      await orderAPI.updateStatus(orderId, { [field]: value });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, [field]: value } : o));
      toast.success('Order updated');
    } catch { toast.error('Update failed'); }
    finally { setUpdating(null); }
  };

  const handleViewOrder = async (orderId) => {
    try {
      const res = await orderAPI.getOne(orderId);
      setSelectedOrder(res.data.order);
    } catch {
      const local = orders.find(o => o._id === orderId);
      setSelectedOrder(local || null);
    }
  };

  const handleProcessRefund = async (orderId, status) => {
    if (!selectedOrder) return;
    
    if (status === 'approved') {
      setShowRefundModal(true);
      return;
    }

    try {
      setUpdating(orderId);
      const res = await orderAPI.updateStatus(orderId, { returnStatus: status, orderStatus: status === 'rejected' ? 'delivered' : selectedOrder.orderStatus });
      setSelectedOrder(res.data.order);
      setOrders(prev => prev.map(o => o._id === orderId ? res.data.order : o));
      toast.success(`Request ${status}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setUpdating(null);
    }
  };

  const handleRefundSuccess = (updatedOrder) => {
    setSelectedOrder(updatedOrder);
    setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
  };

  const handlePrintLabel = (order) => {
    if (!order || !order._id) return toast.error('Order ID missing');
    const addr = order.shippingAddress || {};
    const s = settings || {};
    const orderIdStr = order._id.toString();
    const shortId = orderIdStr.substring(0, 8).toUpperCase();
    const orderNumber = order.orderNumber || shortId;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Shipping Label - ${orderNumber}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Libre+Barcode+128&family=Inter:wght@400;700;900&display=swap');
            * { box-sizing: border-box; }
            body { font-family: 'Inter', sans-serif; margin: 0; padding: 20px; background: #eee; }
            .label-page { 
              background: #fff; 
              width: 100mm; 
              height: 150mm; 
              margin: 0 auto; 
              border: 1px solid #000; 
              display: flex;
              flex-direction: column;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .section { border-bottom: 2px solid #000; padding: 12px; }
            .header { display: flex; justify-content: space-between; align-items: center; min-height: 60px; }
            .brand { font-weight: 900; font-size: 24px; letter-spacing: -1px; }
            .badge { background: #000; color: #fff; padding: 6px 12px; font-weight: 900; font-size: 16px; }
            
            .from-section { font-size: 10px; background: #f9f9f9; min-height: 70px; }
            .to-section { padding: 20px 12px; flex-grow: 1; display: flex; flex-direction: column; justify-content: center; }
            .ship-to-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #666; margin-bottom: 8px; }
            .customer-name { font-size: 22px; font-weight: 900; line-height: 1.1; margin-bottom: 10px; }
            .address-text { font-size: 14px; line-height: 1.4; font-weight: 500; }
            
            .barcode-section { text-align: center; padding: 20px 0; border-top: 3px solid #000; }
            .barcode { font-family: 'Libre Barcode 128', cursive; font-size: 90px; line-height: 1; margin: 5px 0; }
            .order-num { font-weight: 800; font-size: 16px; letter-spacing: 3px; }
            
            .footer-grid { display: grid; grid-template-columns: 1fr 1fr; font-size: 12px; border-top: 2px solid #000; }
            .footer-cell { padding: 10px; border-right: 2px solid #000; }
            .footer-cell:last-child { border-right: none; }
            
            .instruction { font-size: 9px; text-align: center; padding: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #555; }

            @media print {
              body { background: #fff; padding: 0; }
              .label-page { width: 100%; height: 100%; border: none; box-shadow: none; margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="text-align:center; padding: 20px;">
            <button onclick="window.print()" style="padding: 12px 40px; background: #000; color: #fff; border: none; border-radius: 4px; font-weight: 700; cursor: pointer; font-size: 16px;">PRINT LABEL</button>
          </div>

          <div class="label-page">
            <div class="section header">
              <div class="brand">${s.storeName?.toUpperCase() || 'MELORAA'}</div>
              <div class="badge">${order.paymentMethod?.toUpperCase() === 'COD' ? 'COD - ₹' + order.total.toLocaleString() : 'PREPAID'}</div>
            </div>

            <div class="section from-section">
              <div style="font-weight: 800; margin-bottom: 2px;">SENDER:</div>
              ${s.storeName || 'Meloraa'}<br/>
              ${s.address || ''}, ${s.city || ''}<br/>
              ${s.state || ''} ${s.pincode || ''}<br/>
              Phone: ${s.phone || ''}
            </div>

            <div class="to-section">
              <div class="ship-to-label">Ship To:</div>
              <div class="customer-name">${addr.firstName?.toUpperCase() || ''} ${addr.lastName?.toUpperCase() || ''}</div>
              <div class="address-text">
                ${addr.address || ''}<br/>
                ${addr.city?.toUpperCase() || ''}, ${addr.state?.toUpperCase() || ''}<br/>
                <strong>PIN: ${addr.zipCode || ''}</strong><br/>
                <div style="margin-top: 15px; font-size: 16px;">Ph: ${addr.phone || ''}</div>
              </div>
            </div>

            <div class="barcode-section">
              <div class="order-num">${orderNumber}</div>
              <div class="barcode">${orderNumber}</div>
              <div style="font-size: 10px; font-weight: 700;">TRACKING / ORDER ID</div>
            </div>

            <div class="footer-grid">
              <div class="footer-cell">
                <strong>DATE:</strong><br/>
                ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
              <div class="footer-cell">
                <strong>WEIGHT:</strong><br/>
                0.50 KG (Approx)
              </div>
            </div>

            <div class="instruction">
              Handling: Do Not Bend | Keep Dry | Fragile
            </div>
            
            <div style="padding: 10px; font-size: 8px; text-align: center; color: #888; border-top: 1px solid #000;">
              Order Ref: ${shortId} | Powered by Meloraa
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintInvoice = (order) => {
    if (!order) return;
    const addr = order.shippingAddress || {};
    const s = settings || {};
    const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const orderId = order.orderNumber || order._id.toString().substring(0, 8).toUpperCase();

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${orderId}</title>
          <style>
            body { font-family: 'Inter', -apple-system, sans-serif; color: #333; line-height: 1.5; padding: 40px; }
            .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); font-size: 14px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #4f0c10; padding-bottom: 20px; }
            .logo { font-size: 28px; font-weight: bold; color: #4f0c10; font-family: 'Playfair Display', serif; }
            .store-info { text-align: right; font-size: 12px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #888; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            .invoice-details { background: #fcfaf7; padding: 15px; border-radius: 4px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #fcfaf7; color: #4f0c10; font-weight: 600; text-align: left; padding: 12px 8px; border-bottom: 2px solid #eee; }
            td { padding: 12px 8px; border-bottom: 1px solid #eee; }
            .totals { float: right; width: 250px; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .grand-total { font-size: 18px; font-weight: bold; color: #4f0c10; border-top: 2px solid #eee; margin-top: 10px; padding-top: 10px; }
            .footer { margin-top: 100px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 20px; }
            @media print { .no-print { display: none; } body { padding: 0; } .invoice-box { border: none; box-shadow: none; } }
          </style>
        </head>
        <body>
          <div class="no-print" style="text-align:center;margin-bottom:20px;">
            <button onclick="window.print()" style="padding:10px 24px;font-size:16px;cursor:pointer;background:#4f0c10;color:#fff;border:none;border-radius:4px;font-weight:600;">🖨️ Download / Print Invoice</button>
          </div>
          <div class="invoice-box">
            <div class="header">
              <div class="logo">${s.storeName || 'LUXESTORE'}</div>
              <div class="store-info">
                <div style="font-size: 16px; font-weight: 700; color: #4f0c10; margin-bottom: 4px;">${s.storeName || 'LuxeStore'}</div>
                <div>${s.address || ''}</div>
                <div>${s.city || ''}, ${s.state || ''} ${s.pincode || ''}</div>
                <div style="margin-top: 4px;">
                  <span><strong>Ph:</strong> ${s.phone || ''}</span> | 
                  <span><strong>Email:</strong> ${s.email || ''}</span>
                </div>
                ${s.gstin ? `<div style="margin-top: 4px;"><strong>GSTIN:</strong> ${s.gstin}</div>` : ''}
                ${s.pan ? `<div><strong>PAN:</strong> ${s.pan}</div>` : ''}
              </div>
            </div>

            <div class="info-grid">
              <div>
                <div class="section-title">Billed To</div>
                <strong>${addr.firstName || ''} ${addr.lastName || ''}</strong><br/>
                ${addr.address || ''}<br/>
                ${addr.city || ''}, ${addr.state || ''} ${addr.zipCode || ''}<br/>
                Phone: ${addr.phone || ''}
              </div>
              <div class="invoice-details">
                <div class="total-row"><strong>Invoice #:</strong> <span>${orderId}</span></div>
                <div class="total-row"><strong>Date:</strong> <span>${orderDate}</span></div>
                <div class="total-row"><strong>Payment:</strong> <span style="text-transform:uppercase;">${order.paymentMethod}</span></div>
                <div class="total-row"><strong>Status:</strong> <span style="text-transform:capitalize;">${order.paymentStatus}</span></div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Item Description</th>
                  <th style="text-align:center;">HSN</th>
                  <th style="text-align:center;">GST %</th>
                  <th style="text-align:center;">Qty</th>
                  <th style="text-align:right;">Unit Price</th>
                  <th style="text-align:right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td>
                      <strong>${item.product?.name || 'Product'}</strong>
                      ${item.variant ? `<br/><span style="font-size:11px;color:#888;">Variant: ${item.variant}</span>` : ''}
                      <br/><span style="font-size:11px;color:#aaa;">SKU: ${item.sku || item.product?.sku || 'N/A'}</span>
                    </td>
                    <td style="text-align:center;">${item.hsnCode || '—'}</td>
                    <td style="text-align:center;">${item.taxRate || 0}%</td>
                    <td style="text-align:center;">${item.quantity}</td>
                    <td style="text-align:right;">${fmtINR(item.price)}</td>
                    <td style="text-align:right;">${fmtINR(item.total)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div style="display:flex;justify-content:space-between;">
              <div style="font-size:12px;color:#888;max-width:400px;">
                <div class="section-title">Terms & Conditions</div>
                1. Please keep this invoice for any return or exchange.<br/>
                2. Goods once sold will only be replaced as per our RMA policy.<br/>
                3. This is a computer-generated document and does not require a physical signature.
              </div>
              <div class="totals">
                <div class="total-row"><span>Subtotal</span> <span>${fmtINR(order.subtotal)}</span></div>
                ${order.discount > 0 ? `<div class="total-row" style="color:#1e7d32;"><span>Discount</span> <span>-${fmtINR(order.discount)}</span></div>` : ''}
                <div class="total-row"><span>Shipping</span> <span>${fmtINR(order.shipping)}</span></div>
                <div class="total-row"><span>${s.taxLabel || 'GST'}</span> <span>${fmtINR(order.tax)}</span></div>
                <div class="total-row grand-total"><span>Grand Total</span> <span>${fmtINR(order.total)}</span></div>
              </div>
            </div>

            <div class="footer">
              Thank you for shopping with ${s.storeName || 'LuxeStore'}!<br/>
              Visit us again at ${window.location.origin}
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div>
      <div className="page-header">
        <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--maroon)' }}>Order Command Center</h1>
        <p>Oversee logistics, payment segregation, and customer fulfillment</p>
      </div>

      {/* Control Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', gap: '20px', flexWrap: 'wrap' }}>
        {/* Status Tabs */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lifecycle Status</div>
          <div className="admin-orders-tabs" style={{ marginBottom: 0 }}>
            {STATUS_TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`admin-orders-tab ${activeTab === tab ? 'active' : ''}`}>
                {tab.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Segregation */}
        <div style={{ width: '280px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Segregation</div>
          <div style={{ display: 'flex', background: '#f5f5f5', padding: '4px', borderRadius: '8px', border: '1px solid #eee' }}>
            {PAYMENT_METHODS.map(m => (
              <button key={m} onClick={() => setActivePaymentMethod(m)}
                style={{ 
                  flex: 1, padding: '8px 12px', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer',
                  background: activePaymentMethod === m ? 'white' : 'transparent',
                  color: activePaymentMethod === m ? 'var(--maroon)' : '#888',
                  boxShadow: activePaymentMethod === m ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 0.2s'
                }}>
                {m.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner spinner-lg" /></div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎯</div>
          <div className="empty-state-title">No Orders Found</div>
          <div className="empty-state-text">No {activeTab !== 'all' ? activeTab : ''} {activePaymentMethod !== 'all' ? activePaymentMethod : ''} orders at the moment.</div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Payment Type</th>
                <th>Total</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id} style={{ opacity: updating === order._id ? 0.6 : 1 }}>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--gold)' }}>{order.orderNumber || '#' + (order._id?.toString() || '').substring(0, 8).toUpperCase()}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>{order.user?.name || '—'}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{order.user?.email}</div>
                  </td>
                  <td>
                    <span style={{ 
                      fontSize: '0.65rem', fontWeight: '800', padding: '4px 8px', borderRadius: '4px',
                      background: order.paymentMethod === 'cod' ? 'rgba(176, 90, 0, 0.1)' : 'rgba(30, 125, 50, 0.1)',
                      color: order.paymentMethod === 'cod' ? '#b05a00' : '#1e7d32',
                      border: `1px solid ${order.paymentMethod === 'cod' ? 'rgba(176, 90, 0, 0.2)' : 'rgba(30, 125, 50, 0.2)'}`
                    }}>
                      {order.paymentMethod === 'cod' ? 'COD' : 'PREPAID'}
                    </span>
                    <div style={{ fontSize: '0.6rem', color: '#999', marginTop: '4px' }}>{order.paymentMethod === 'cod' ? 'Cash on Delivery' : (order.paymentMethod?.toUpperCase() || 'ONLINE')}</div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{fmtINR(order.total)}</td>
                  <td>
                    <div className="inline-status">
                      <select className="form-input" value={order.orderStatus} onChange={e => handleStatusUpdate(order._id, 'orderStatus', e.target.value)} disabled={updating === order._id}
                        style={{ padding: '6px 12px', fontSize: '0.75rem', width: '130px' }}>
                        {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.replace('-', ' ').charAt(0).toUpperCase() + s.replace('-', ' ').slice(1)}</option>)}
                      </select>
                    </div>
                  </td>
                  <td>
                    <div className="inline-status">
                      <select className="form-input" value={order.paymentStatus} onChange={e => handleStatusUpdate(order._id, 'paymentStatus', e.target.value)} disabled={updating === order._id}
                        style={{ padding: '6px 12px', fontSize: '0.75rem', width: '110px', color: order.paymentStatus === 'paid' ? '#1e7d32' : order.paymentStatus === 'failed' ? '#d93025' : '#b05a00' }}>
                        {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                      </select>
                    </div>
                  </td>
                  <td style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-ghost btn-sm" title="View order details" onClick={() => handleViewOrder(order._id)}>View</button>
                      <button className="btn btn-ghost btn-sm" title="Print Invoice" onClick={() => handlePrintInvoice(order)} style={{ fontSize: '0.75rem' }}>📄</button>
                      <button className="btn btn-ghost btn-sm" title="Print shipping label" onClick={() => handlePrintLabel(order)} style={{ fontSize: '0.75rem' }}>🏷️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="order-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="order-modal" onClick={e => e.stopPropagation()}>
            <div className="order-modal-header">
              <div>
                <h2 className="order-modal-title">Order Details</h2>
                <span className="order-modal-id">#{selectedOrder._id?.toString().substring(0, 8).toUpperCase()}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => handlePrintInvoice(selectedOrder)}>📄 Invoice</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowRefundModal(true)}>💸 Refund</button>
                <button className="btn btn-ghost btn-sm" onClick={() => handlePrintLabel(selectedOrder)}>🖨️ Label</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedOrder(null)}>✕</button>
              </div>
            </div>

            <div className="order-modal-info-grid">
              <div className="order-info-card">
                <div className="order-info-label">Customer</div>
                <div style={{ fontWeight: '600' }}>{selectedOrder.user?.name || 'Guest'}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{selectedOrder.user?.email}</div>
              </div>
              <div className="order-info-card">
                <div className="order-info-label">Shipping Address</div>
                <div style={{ fontSize: '0.85rem' }}>
                  {selectedOrder.shippingAddress ? (
                    <>
                      {selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}<br />
                      {selectedOrder.shippingAddress.address}<br />
                      {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}
                      {selectedOrder.shippingAddress.phone && <><br />📞 {selectedOrder.shippingAddress.phone}</>}
                    </>
                  ) : 'N/A'}
                </div>
              </div>
            </div>

            <div className="order-status-row">
              <div className="order-status-item">
                <div className="order-info-label">Order Status</div>
                <div className="order-status-text" style={{ color: selectedOrder.orderStatus === 'delivered' ? 'var(--sage)' : 'var(--gold)', textTransform: 'capitalize' }}>{selectedOrder.orderStatus}</div>
              </div>
              <div className="order-status-item">
                <div className="order-info-label">Payment</div>
                <div className="order-status-text" style={{ color: selectedOrder.paymentStatus === 'paid' ? 'var(--sage)' : 'var(--gold)' }}>{selectedOrder.paymentStatus}</div>
              </div>
              <div className="order-status-item">
                <div className="order-info-label">Method</div>
                <div style={{ fontWeight: '600', textTransform: 'uppercase', color: selectedOrder.paymentMethod === 'cod' ? '#b05a00' : '#1e7d32' }}>{selectedOrder.paymentMethod || 'Prepaid'}</div>
              </div>
            </div>

            {selectedOrder.orderStatus === 'Refund Requested' && (
              <div style={{ background: 'rgba(212, 175, 55, 0.1)', padding: '20px', borderRadius: 'var(--r-md)', border: '1px solid var(--gold)', marginBottom: '24px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', color: 'var(--gold)' }}>Return Requested</div>
                <div style={{ fontSize: '0.9rem', marginBottom: '16px' }}>Reason: "{selectedOrder.returnReason}"</div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn btn-gold btn-sm" onClick={() => handleProcessRefund(selectedOrder._id, 'approved')}>PROCESS REFUND</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleProcessRefund(selectedOrder._id, 'rejected')}>REJECT REQUEST</button>
                </div>
              </div>
            )}

            <div className="order-items-list">
              <div className="order-info-label" style={{ marginBottom: '12px' }}>Order Items</div>
              {selectedOrder.items?.map((item, idx) => (
                <div key={idx} className="order-item-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {item.product?.images?.[0] && <img src={item.product.images[0]} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 'var(--r-sm)' }} />}
                    <div>
                      <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{item.product?.name || 'Product'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Qty: {item.quantity}</div>
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{fmtINR(item.total || item.price * item.quantity)}</div>
                </div>
              ))}
            </div>

            {selectedOrder.refunds?.length > 0 && (
              <div style={{ marginTop: '24px', padding: '20px', background: 'var(--bg-lighter)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                <div className="order-info-label" style={{ marginBottom: '12px' }}>Refund History</div>
                {selectedOrder.refunds.map((ref, idx) => (
                  <div key={idx} style={{ padding: '8px 0', borderBottom: idx < selectedOrder.refunds.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--red)', fontWeight: '600' }}>-{fmtINR(ref.amount)}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{new Date(ref.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                    {ref.reason && <div style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--muted)' }}>"{ref.reason}"</div>}
                  </div>
                ))}
              </div>
            )}

            <div className="order-totals-card">
              <div className="order-total-row">
                <span style={{ color: 'var(--muted)' }}>Subtotal</span><span>{fmtINR(selectedOrder.subtotal)}</span>
              </div>
              {selectedOrder.discount > 0 && <div className="order-total-row">
                <span style={{ color: 'var(--sage)' }}>Discount</span><span style={{ color: 'var(--sage)' }}>-{fmtINR(selectedOrder.discount)}</span>
              </div>}
              <div className="order-total-row">
                <span style={{ color: 'var(--muted)' }}>Shipping</span><span>{fmtINR(selectedOrder.shipping)}</span>
              </div>
              <div className="order-total-row">
                <span style={{ color: 'var(--muted)' }}>Tax</span><span>{fmtINR(selectedOrder.tax)}</span>
              </div>
              {selectedOrder.totalRefunded > 0 && <div className="order-total-row">
                <span style={{ color: 'var(--red)' }}>Total Refunded</span><span style={{ color: 'var(--red)' }}>-{fmtINR(selectedOrder.totalRefunded)}</span>
              </div>}
              <div className="order-total-final">
                <span>Total</span><span>{fmtINR(selectedOrder.total - (selectedOrder.totalRefunded || 0))}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRefundModal && selectedOrder && (
        <RefundModal 
          order={selectedOrder} 
          onClose={() => setShowRefundModal(false)} 
          onSuccess={handleRefundSuccess} 
        />
      )}
    </div>
  );
}
