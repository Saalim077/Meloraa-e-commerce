import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../utils/api';
import Header from '../components/Header';
import '../styles/checkout.css';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);
  const [cartItems, setCartItems] = useState(JSON.parse(localStorage.getItem('cart') || '[]'));
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    taxEnabled: true,
    taxRate: 0,
    taxLabel: 'Tax',
    shippingEnabled: true,
    standardShippingCost: 99,
    freeShippingThreshold: 1000
  });
  const [formData, setFormData] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ')[1] || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    paymentMethod: 'cod'
  });

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get(`/settings?t=${new Date().getTime()}`);
        setSettings(data);
      } catch (error) {
        console.warn('Failed to fetch tax settings, using defaults', error);
      }
    };
    fetchSettings();
  }, []);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput) return;
    try {
      setLoading(true);
      const { data } = await api.post('/coupons/validate', { 
        code: couponInput, 
        subtotal,
        items: cartItems.map(item => ({
          product: item.productId || item._id,
          quantity: item.quantity,
          price: item.price
        }))
      });
      setAppliedCoupon(data.coupon);
      setDiscount(data.discount);
      toast.success('Coupon applied successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid coupon code');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponInput('');
  };

  let calculatedTax = 0;
  if (settings.taxEnabled) {
    cartItems.forEach(item => {
      let rate = settings.taxRate || 0;
      if (item.taxClass && settings.taxClasses && Array.isArray(settings.taxClasses)) {
        const found = settings.taxClasses.find(c => c.name === item.taxClass);
        if (found) rate = found.rate;
      }
      
      if (settings.taxInclusive) {
        // Extract tax: Price * (rate / (100 + rate))
        calculatedTax += (item.price * item.quantity) * (rate / (100 + rate));
      } else {
        // Add tax: Price * (rate / 100)
        calculatedTax += (item.price * item.quantity) * (rate / 100);
      }
    });
  }

  const shipping = settings.shippingEnabled
    ? (Number(subtotal - discount) > Number(settings.freeShippingThreshold || 1000) ? 0 : Number(settings.standardShippingCost || 99))
    : 0;

  const taxableAmount = subtotal - discount + shipping;
  let taxMultiplier = 1;
  if (subtotal > 0) {
    taxMultiplier = taxableAmount / subtotal;
  }
  const tax = settings.taxEnabled ? calculatedTax * taxMultiplier : 0;
  const total = settings.taxEnabled && settings.taxInclusive ? taxableAmount : (taxableAmount + tax);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Comprehensive Validation
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode'];
    const missingFields = requiredFields.filter(f => !formData[f]);
    
    if (missingFields.length > 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);

      const orderData = {
        items: cartItems.map(item => ({
          product: item.productId || item._id,
          quantity: item.quantity || item.qty || 1,
          variant: item.variant || null
        })),
        shippingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          phone: formData.phone,
          email: formData.email
        },
        paymentMethod: formData.paymentMethod,
        subtotal,
        discount,
        tax,
        total,
        couponCode: appliedCoupon?.code || null
      };

      const response = await api.post('/orders', orderData);

      // Clear cart
      localStorage.removeItem('cart');

      toast.success('Order created successfully!');
      navigate(`/order-confirmation/${response.data.order?._id || response.data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <>
        <Header />
        <div className="checkout-page">
          <div className="empty-cart-message">
            <p>Your cart is empty</p>
            <Link to="/" className="btn-shop">Start Shopping</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="checkout-page">
        <div className="checkout-container">
          <h1>Checkout</h1>

          <div className="checkout-layout">
            {/* Form */}
            <form className="checkout-form" onSubmit={handleSubmit}>
              <div className="form-section">
                <h2>Shipping Information</h2>

                <div className="form-row">
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />

                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />

                <input
                  type="text"
                  name="address"
                  placeholder="Street Address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />

                <div className="form-row">
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                  <input
                    type="text"
                    name="state"
                    placeholder="State"
                    value={formData.state}
                    onChange={handleChange}
                    required
                  />
                  <input
                    type="text"
                    name="zipCode"
                    placeholder="ZIP Code"
                    value={formData.zipCode}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-section">
                <h2>Payment Method</h2>
                <div className="payment-methods">
                  <label className={`payment-option ${formData.paymentMethod === 'card' ? 'active' : ''}`}>
                    <input type="radio" name="paymentMethod" value="card" checked={formData.paymentMethod === 'card'} onChange={handleChange} required style={{ display: 'none' }} />
                    <div className="payment-info">
                      <div className="title">Credit/Debit Card</div>
                      <div className="desc">Pay securely with Stripe</div>
                    </div>
                    {formData.paymentMethod === 'card' && <span style={{ color: '#4f0c10' }}>✓</span>}
                  </label>

                  <label className={`payment-option ${formData.paymentMethod === 'cod' ? 'active' : ''}`}>
                    <input type="radio" name="paymentMethod" value="cod" checked={formData.paymentMethod === 'cod'} onChange={handleChange} required style={{ display: 'none' }} />
                    <div className="payment-info">
                      <div className="title">Cash on Delivery (COD)</div>
                      <div className="desc">Pay when your order arrives</div>
                    </div>
                    {formData.paymentMethod === 'cod' && <span style={{ color: '#4f0c10' }}>✓</span>}
                  </label>
                </div>
              </div>

              <button type="submit" className="btn-place-order" disabled={loading}>
                {loading ? 'Processing...' : 'Place Order'}
              </button>
            </form>

            {/* Order Summary */}
            <div className="checkout-summary">
              <h2>Order Summary</h2>

              <div className="summary-items">
                {cartItems.map(item => (
                  <div key={`${item.productId || item._id}-${item.variant || 'default'}`} className="summary-item">
                    <div style={{ flex: 1 }}>
                      <p className="item-name">
                        {item.name}
                        {item.variant && <span style={{ display: 'block', fontSize: '0.75rem', color: '#888', marginTop: '2px', fontWeight: '400' }}>Variant: {item.variant}</span>}
                      </p>
                      <p className="item-qty">Qty: {item.quantity}</p>
                    </div>
                    <p className="item-total">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>

              <div className="summary-totals">
                <div className="total-row">
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                
                {discount > 0 && (
                  <div className="total-row" style={{ color: '#155724' }}>
                    <span>Discount ({appliedCoupon?.code}):</span>
                    <span>-₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {settings.taxEnabled && (
                  <div className="total-row">
                    <span>{settings.taxInclusive ? 'Includes ' : ''}{settings.taxLabel || 'Tax'}:</span>
                    <span>₹{tax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                
                <div className="total-row">
                  <span>Shipping:</span>
                  <span>{shipping === 0 ? 'Free' : `₹${shipping.toLocaleString('en-IN')}`}</span>
                </div>
                
                <div className="total-row total">
                  <span>Total:</span>
                  <span>₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Coupon Section */}
              <div className="coupon-section">
                {!appliedCoupon ? (
                  <>
                    <p style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Have a Coupon?</p>
                    <div className="coupon-input-group">
                      <input 
                        type="text" 
                        placeholder="Enter Code" 
                        className="coupon-input"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      />
                      <button type="button" className="btn-apply" onClick={handleApplyCoupon} disabled={loading}>
                        Apply
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="applied-coupon">
                    <div className="coupon-tag">
                      <span>🏷️</span>
                      <span>{appliedCoupon.code} Applied</span>
                    </div>
                    <button type="button" className="btn-remove-coupon" onClick={handleRemoveCoupon}>×</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
