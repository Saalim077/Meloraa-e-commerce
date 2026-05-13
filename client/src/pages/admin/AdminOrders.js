import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { orderAPI } from '../../utils/api';
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

  useEffect(() => { load(); }, [load]);

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
    const orderIdStr = order._id.toString();
    const shortId = orderIdStr.substring(0, 8).toUpperCase();

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Shipping Label - Order #${shortId}</title>
          <style>
            body { font-family: 'Arial', sans-serif; padding: 40px; color: #000; }
            .label-box { border: 2px solid #000; padding: 30px; max-width: 600px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 16px; margin-bottom: 20px; }
            h1 { margin: 0; font-size: 22px; text-transform: uppercase; letter-spacing: 2px; }
            .from { margin-bottom: 24px; font-size: 0.9em; color: #555; }
            .to { font-size: 1.1em; font-weight: bold; padding: 15px; background: #f5f5f5; border-radius: 4px; margin-bottom: 20px; }
            .order-details { font-size: 0.85em; border-top: 1px solid #ddd; padding-top: 16px; }
            .routing { text-align: center; font-family: monospace; font-size: 1.2rem; letter-spacing: 5px; border: 1px dashed #666; padding: 10px; margin: 16px 0; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="no-print" style="text-align:center;margin-bottom:20px;">
            <button onclick="window.print()" style="padding:10px 24px;font-size:16px;cursor:pointer;background:#000;color:#fff;border:none;border-radius:4px;">🖨️ Print Label</button>
          </div>
          <div class="label-box">
            <div class="header"><h1>LUXESTORE SHIPPING</h1></div>
            <div class="from">
              <strong>FROM:</strong><br/>
              LuxeStore Warehouse<br/>
              123 Fashion Avenue<br/>
              Mumbai, MH 400001
            </div>
            <div class="to">
              <strong>SHIP TO:</strong><br/>
              ${addr.firstName || ''} ${addr.lastName || ''}<br/>
              ${addr.address || 'N/A'}<br/>
              ${addr.city || ''}, ${addr.state || ''} ${addr.zipCode || ''}
              ${addr.phone ? '<br/>Phone: ' + addr.phone : ''}
            </div>
            <div class="routing">
              LS-${shortId}
            </div>
            <div class="order-details">
              <strong>Order ID:</strong> ${orderIdStr}<br/>
              <strong>Date:</strong> ${order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : 'N/A'}<br/>
              <strong>Items:</strong> ${order.items?.length || 0} item(s)<br/>
              <strong>Total:</strong> ${fmtINR(order.total)}<br/>
              <strong>Payment:</strong> ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : (order.paymentMethod || 'Card')}
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
                <button className="btn btn-ghost btn-sm" onClick={() => setShowRefundModal(true)}>💸 Refund</button>
                <button className="btn btn-ghost btn-sm" onClick={() => handlePrintLabel(selectedOrder)}>🖨️ Print Label</button>
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
