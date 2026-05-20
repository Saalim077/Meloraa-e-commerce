import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/pages.css';

const STEPS = [
  { key: 'pending', label: 'Order Placed', icon: '📋', desc: 'Your order has been received' },
  { key: 'confirmed', label: 'Confirmed', icon: '✅', desc: 'Order confirmed by seller' },
  { key: 'processing', label: 'Processing', icon: '⚙️', desc: 'Your items are being prepared' },
  { key: 'shipped', label: 'Shipped', icon: '🚚', desc: 'On the way to you' },
  { key: 'delivered', label: 'Delivered', icon: '📦', desc: 'Successfully delivered' },
];

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!orderId.trim()) return;
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const res = await api.get(`/orders/${orderId.trim()}`);
      setOrder(res.data.order);
    } catch (err) {
      setError(err.response?.status === 404 ? 'Order not found. Please check the Order ID.' : 'Unable to fetch order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStepIndex = (status) => {
    const idx = STEPS.findIndex(s => s.key === status?.toLowerCase());
    return idx === -1 ? 0 : idx;
  };

  return (
    <div style={{ background: '#faf8f6', minHeight: '100vh' }}>
      <Header />
      <section className="page-hero">
        <h1>Track Your Order</h1>
        <p>Enter your order ID to see real-time status</p>
        <div className="breadcrumb"><Link to="/">Home</Link> / Track Order</div>
      </section>

      <div className="page-container">
        <form className="track-form" onSubmit={handleTrack}>
          <input type="text" placeholder="Enter Order ID (e.g., 6650abc...)" value={orderId}
            onChange={e => setOrderId(e.target.value)} required />
          <button type="submit" disabled={loading}>{loading ? 'Searching...' : 'Track'}</button>
        </form>

        {error && (
          <div className="content-section" style={{ textAlign: 'center', color: '#e05252' }}>
            <p style={{ fontSize: '1.1rem', margin: 0 }}>⚠️ {error}</p>
          </div>
        )}

        {order && (
          <div className="content-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', marginBottom: '32px' }}>
               <div>
                <h2 style={{ margin: '0 0 8px' }}>Order #{order._id?.slice(-8).toUpperCase()}</h2>
                <p style={{ color: '#8a8a8a', margin: 0, fontSize: '0.9rem' }}>Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: 700, color: '#4f0c10', fontSize: '1.3rem', margin: '0 0 4px' }}>₹{order.total?.toLocaleString('en-IN')}</p>
                <p style={{ color: '#8a8a8a', margin: 0, fontSize: '0.85rem' }}>{order.items?.length || 0} item(s)</p>
              </div>
            </div>

            {/* Timeline */}
            <div className="timeline">
              {STEPS.map((step, i) => {
                const currentIdx = getStepIndex(order.orderStatus || order.status);
                const isCompleted = i < currentIdx;
                const isActive = i === currentIdx;
                return (
                  <div key={step.key} className={`timeline-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                    <div className="timeline-dot">{step.icon}</div>
                    <div className="timeline-content">
                      <h4>{step.label}</h4>
                      <p>{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Items */}
            {order.items && order.items.length > 0 && (
              <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #e5e2df' }}>
                <h3 style={{ marginBottom: '16px' }}>Items in this order</h3>
                {order.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f0eeeb' }}>
                    <div>
                      <p style={{ fontWeight: 600, margin: 0, color: '#1a1a1a' }}>{item.product?.name || item.name || 'Product'}</p>
                      <p style={{ color: '#8a8a8a', margin: '4px 0 0', fontSize: '0.85rem' }}>Qty: {item.quantity}</p>
                    </div>
                    <p style={{ fontWeight: 700, color: '#4f0c10' }}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!order && !error && !loading && (
          <div className="info-grid" style={{ marginTop: '40px' }}>
            <div className="info-card"><div className="card-icon">📧</div><h3>Check Your Email</h3><p>Your order ID was sent to your email after placing the order</p></div>
            <div className="info-card"><div className="card-icon">👤</div><h3>Sign In</h3><p>View all your orders by signing into your account</p></div>
            <div className="info-card"><div className="card-icon">💬</div><h3>Need Help?</h3><p><Link to="/contact" style={{ color: '#4f0c10' }}>Contact us</Link> and we'll help you find your order</p></div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
