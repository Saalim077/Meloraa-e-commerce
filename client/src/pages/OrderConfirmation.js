import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderAPI } from '../utils/api';
import Header from '../components/Header';
import '../styles/order-confirmation.css';

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await orderAPI.getOne(orderId);
      setOrder(response.data.order || response.data.data || response.data);
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="order-confirmation">
        <div className="confirmation-container">
          {loading ? (
            <div className="loading-center">
              <div className="spinner spinner-lg" />
            </div>
          ) : order ? (
            <>
              <div className="success-badge">
                <span className="check-mark">✓</span>
              </div>

              <h1>Order Confirmed!</h1>
              <p className="confirmation-message">
                Thank you for your order. We'll send you an email confirmation shortly.
              </p>

              <div className="order-details">
                <div className="detail-row">
                  <span className="label">Order ID:</span>
                  <span className="value">{order._id?.slice(-8) || order._id}</span>
                </div>

                <div className="detail-row">
                  <span className="label">Date:</span>
                  <span className="value">
                    {new Date(order.createdAt).toLocaleDateString('en-IN')}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="label">Total Amount:</span>
                  <span className="value amount">₹{order.total?.toLocaleString('en-IN') || '0'}</span>
                </div>

                <div className="detail-row">
                  <span className="label">Status:</span>
                  <span className={`value status ${order.status?.toLowerCase()}`}>
                    {order.status || 'Pending'}
                  </span>
                </div>
              </div>

              <div className="order-items">
                <h2>Order Items</h2>
                {order.items?.map((item, idx) => (
                  <div key={idx} className="item-row">
                    <div>
                      <p className="item-name">{item.name}</p>
                      <p className="item-qty">Quantity: {item.quantity}</p>
                    </div>
                    <p className="item-price">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>

              <div className="shipping-address">
                <h2>Shipping Address</h2>
                {order.shippingAddress ? (
                  <p>
                    {order.shippingAddress.firstName} {order.shippingAddress.lastName}<br/>
                    {order.shippingAddress.address}<br/>
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}<br/>
                    {order.shippingAddress.phone}
                  </p>
                ) : (
                  <p>No address available</p>
                )}
              </div>

              <div className="confirmation-actions">
                <Link to="/" className="btn-continue-shopping">
                  Continue Shopping
                </Link>
                {order._id && (
                  <Link to={`/order/${order._id}`} className="btn-track-order">
                    Track Order
                  </Link>
                )}
              </div>
            </>
          ) : (
            <div className="error-message">
              <p>Order not found</p>
              <Link to="/" className="btn-home">Back to Home</Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
