import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { orderAPI } from '../../utils/api';

export default function RefundModal({ order, onClose, onSuccess }) {
  const [refundAmount, setRefundAmount] = useState(order.total - (order.totalRefunded || 0));
  const [reason, setReason] = useState('');
  const [restock, setRestock] = useState(true);
  const [itemsToRefund, setItemsToRefund] = useState(
    order.items.map(item => ({
      product: item.product._id,
      name: item.product.name,
      quantity: 0,
      maxQuantity: item.quantity
    }))
  );
  const [loading, setLoading] = useState(false);

  const handleQtyChange = (idx, val) => {
    const newItems = [...itemsToRefund];
    newItems[idx].quantity = Math.min(Math.max(0, parseInt(val) || 0), newItems[idx].maxQuantity);
    setItemsToRefund(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (refundAmount <= 0) return toast.error("Refund amount must be greater than 0");
    if (refundAmount > (order.total - (order.totalRefunded || 0))) return toast.error("Exceeds remaining order total");

    setLoading(true);
    try {
      const payload = {
        amount: parseFloat(refundAmount),
        reason,
        restockItems: restock,
        itemsToRestock: itemsToRefund.filter(i => i.quantity > 0).map(i => ({
          product: i.product,
          quantity: i.quantity
        }))
      };

      const res = await orderAPI.refund(order._id, payload);
      toast.success("Refund processed successfully");
      onSuccess(res.data.order);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Refund failed");
    } finally {
      setLoading(false);
    }
  };

  const remainingTotal = order.total - (order.totalRefunded || 0);

  return (
    <div className="order-modal-overlay" style={{ zIndex: 1100 }}>
      <div className="order-modal" style={{ maxWidth: '500px' }}>
        <div className="order-modal-header">
          <div>
            <h2 className="order-modal-title">Process Refund</h2>
            <span className="order-modal-id">Remaining: ₹{remainingTotal.toLocaleString('en-IN')}</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '0 24px 24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label className="order-info-label" style={{ display: 'block', marginBottom: '8px' }}>Refund Amount (₹)</label>
            <input 
              type="number" 
              className="form-control" 
              value={refundAmount} 
              onChange={e => setRefundAmount(e.target.value)}
              step="0.01"
              max={remainingTotal}
              required
              style={{ width: '100%', background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'white', padding: '10px', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label className="order-info-label" style={{ display: 'block', marginBottom: '8px' }}>Reason for Refund</label>
            <textarea 
              className="form-control" 
              value={reason} 
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Customer returned items, Out of stock"
              style={{ width: '100%', background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'white', padding: '10px', borderRadius: '4px', height: '80px' }}
            />
          </div>

          <div style={{ marginBottom: '20px', border: '1px solid var(--border)', borderRadius: '4px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <label className="order-info-label" style={{ margin: 0 }}>Restock Items?</label>
              <input type="checkbox" checked={restock} onChange={e => setRestock(e.target.checked)} />
            </div>
            
            {restock && (
              <div style={{ fontSize: '0.85rem' }}>
                {itemsToRefund.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--muted)' }}>{item.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="number" 
                        value={item.quantity} 
                        onChange={e => handleQtyChange(idx, e.target.value)}
                        style={{ width: '50px', background: 'black', border: '1px solid var(--border)', color: 'white', textAlign: 'center' }}
                      />
                      <span style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>/ {item.maxQuantity}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button type="submit" className="btn btn-gold" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Processing...' : `Refund ₹${parseFloat(refundAmount || 0).toLocaleString('en-IN')}`}
            </button>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
