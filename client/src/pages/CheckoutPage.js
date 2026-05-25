import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../utils/api';
import Header from '../components/Header';
import { clearCart } from '../store';
import '../styles/checkout.css';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
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

  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [checkoutStep, setCheckoutStep] = useState(1);


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

  // Prefill default or selected address
  useEffect(() => {
    if (user) {
      const defaultAddr = user.addresses?.find(a => a.isDefault) || user.addresses?.[0];
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr._id);
        setFormData(prev => ({
          ...prev,
          firstName: defaultAddr.firstName || user.name?.split(' ')[0] || '',
          lastName: defaultAddr.lastName || user.name?.split(' ')[1] || '',
          email: user.email || '',
          phone: defaultAddr.phone || user.phone || '',
          address: defaultAddr.address || defaultAddr.addressLine1 || '',
          city: defaultAddr.city || '',
          state: defaultAddr.state || '',
          zipCode: defaultAddr.zipCode || defaultAddr.pincode || '',
        }));
      } else {
        setSelectedAddressId('new');
        setFormData(prev => ({
          ...prev,
          firstName: user.name?.split(' ')[0] || '',
          lastName: user.name?.split(' ')[1] || '',
          email: user.email || '',
          phone: user.phone || '',
        }));
      }
    }
  }, [user]);

  const handleAddressSelect = (addrId) => {
    setSelectedAddressId(addrId);
    if (addrId === 'new') {
      setFormData(prev => ({
        ...prev,
        address: '',
        city: '',
        state: '',
        zipCode: ''
      }));
    } else {
      const addr = user?.addresses?.find(a => a._id === addrId);
      if (addr) {
        setFormData(prev => ({
          ...prev,
          firstName: addr.firstName || prev.firstName,
          lastName: addr.lastName || prev.lastName,
          phone: addr.phone || prev.phone,
          address: addr.address || addr.addressLine1 || '',
          city: addr.city || '',
          state: addr.state || '',
          zipCode: addr.zipCode || addr.pincode || ''
        }));
      }
    }
  };

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

  const handleContinueToPayment = (e) => {
    e.preventDefault();
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode'];
    const missingFields = requiredFields.filter(f => !formData[f]);
    
    if (missingFields.length > 0) {
      toast.error('Please fill in all shipping fields');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setCheckoutStep(2);
  };

  const handleContinueToReview = (e) => {
    e.preventDefault();
    if (!formData.paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }
    setCheckoutStep(3);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    // Comprehensive Validation
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode'];
    const missingFields = requiredFields.filter(f => !formData[f]);
    
    if (missingFields.length > 0) {
      toast.error('Please fill in all required fields');
      setCheckoutStep(1);
      return;
    }

    if (!formData.paymentMethod) {
      toast.error('Please select a payment method');
      setCheckoutStep(2);
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
      dispatch(clearCart());

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
            {/* Accordion Steps Form */}
            <form className="checkout-form" onSubmit={handleSubmit}>
              
              {/* STEP 1: SHIPPING DETAILS */}
              <div className={`checkout-accordion-step ${checkoutStep === 1 ? 'active' : ''} ${checkoutStep > 1 ? 'completed' : ''}`}>
                <div className="step-header" onClick={() => checkoutStep > 1 && setCheckoutStep(1)}>
                  <div className="step-header-left">
                    <span className="step-number">1</span>
                    <div className="step-header-text">
                      <h3>Shipping Information</h3>
                      {checkoutStep > 1 && (
                        <p className="step-summary">
                          {formData.firstName} {formData.lastName} • {formData.address}, {formData.city} • {formData.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  {checkoutStep > 1 && <button type="button" className="step-edit-btn">Edit</button>}
                </div>

                {checkoutStep === 1 && (
                  <div className="step-content">
                    {user?.addresses && user.addresses.length > 0 && (
                      <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--maroon)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '10px' }}>
                          Select Delivery Address
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                          {user.addresses.map((addr) => (
                            <div
                              key={addr._id}
                              onClick={() => handleAddressSelect(addr._id)}
                              style={{
                                padding: '14px',
                                border: selectedAddressId === addr._id ? '2px solid #4f0c10' : '1px solid #e5e2df',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                background: selectedAddressId === addr._id ? 'rgba(79, 12, 16, 0.02)' : 'white',
                                transition: 'all 0.2s',
                              }}
                            >
                              <div style={{ fontWeight: '700', fontSize: '0.85rem', marginBottom: '6px', color: '#1a1a1a', display: 'flex', justifyContent: 'space-between', letterSpacing: '0.05em' }}>
                                <span>{addr.type?.toUpperCase() || 'HOME'}</span>
                                {addr.isDefault && <span style={{ fontSize: '0.7rem', color: '#4f0c10', background: '#f5ebeb', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>DEFAULT</span>}
                              </div>
                              <div style={{ fontSize: '0.825rem', color: '#666', lineHeight: '1.5' }}>
                                <strong>{addr.firstName} {addr.lastName}</strong><br />
                                {addr.address || addr.addressLine1}<br />
                                {addr.city}, {addr.state} - {addr.zipCode || addr.pincode}
                              </div>
                            </div>
                          ))}
                          <div
                            onClick={() => handleAddressSelect('new')}
                            style={{
                              padding: '14px',
                              border: selectedAddressId === 'new' ? '2px solid #4f0c10' : '1px dashed #ddd',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              background: selectedAddressId === 'new' ? 'rgba(79, 12, 16, 0.02)' : 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.85rem',
                              fontWeight: '700',
                              color: '#4f0c10',
                              minHeight: '80px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em'
                            }}
                          >
                            + New Address
                          </div>
                        </div>
                      </div>
                    )}

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

                    <button 
                      type="button" 
                      className="btn-continue-step" 
                      onClick={handleContinueToPayment}
                    >
                      Continue to Payment ➔
                    </button>
                  </div>
                )}
              </div>

              {/* STEP 2: PAYMENT METHOD */}
              <div className={`checkout-accordion-step ${checkoutStep === 2 ? 'active' : ''} ${checkoutStep > 2 ? 'completed' : ''} ${checkoutStep < 2 ? 'locked' : ''}`}>
                <div className="step-header" onClick={() => checkoutStep > 2 && setCheckoutStep(2)}>
                  <div className="step-header-left">
                    <span className="step-number">2</span>
                    <div className="step-header-text">
                      <h3>Payment Method</h3>
                      {checkoutStep > 2 && (
                        <p className="step-summary">
                          {formData.paymentMethod === 'card' ? 'Stripe Credit/Debit Card' : 'Cash on Delivery (COD)'}
                        </p>
                      )}
                    </div>
                  </div>
                  {checkoutStep > 2 && <button type="button" className="step-edit-btn">Edit</button>}
                </div>

                {checkoutStep === 2 && (
                  <div className="step-content">
                    <div className="payment-methods">
                      <label className={`payment-option ${formData.paymentMethod === 'card' ? 'active' : ''}`}>
                        <input type="radio" name="paymentMethod" value="card" checked={formData.paymentMethod === 'card'} onChange={handleChange} required style={{ display: 'none' }} />
                        <div className="payment-info">
                          <div className="title">Credit/Debit Card</div>
                          <div className="desc">Pay securely with Stripe</div>
                        </div>
                        {formData.paymentMethod === 'card' && <span style={{ color: '#4f0c10', fontWeight: 'bold' }}>✓</span>}
                      </label>

                      <label className={`payment-option ${formData.paymentMethod === 'cod' ? 'active' : ''}`}>
                        <input type="radio" name="paymentMethod" value="cod" checked={formData.paymentMethod === 'cod'} onChange={handleChange} required style={{ display: 'none' }} />
                        <div className="payment-info">
                          <div className="title">Cash on Delivery (COD)</div>
                          <div className="desc">Pay when your order arrives</div>
                        </div>
                        {formData.paymentMethod === 'cod' && <span style={{ color: '#4f0c10', fontWeight: 'bold' }}>✓</span>}
                      </label>
                    </div>

                    {formData.paymentMethod === 'card' && (
                      <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#fff8f8', border: '1px solid #ffd0d0', borderRadius: '6px', color: '#4f0c10', fontSize: '0.85rem', lineHeight: '1.5' }}>
                        <strong style={{ display: 'block', marginBottom: '5px' }}>🔒 Secure Sandbox Mode Active</strong>
                        Our Stripe payment gateway is currently operating in secure test mode for verification. Your order will be placed successfully without requiring actual card details.
                      </div>
                    )}

                    <button 
                      type="button" 
                      className="btn-continue-step" 
                      onClick={handleContinueToReview}
                    >
                      Continue to Review ➔
                    </button>
                  </div>
                )}
              </div>

              {/* STEP 3: REVIEW & PLACE ORDER */}
              <div className={`checkout-accordion-step ${checkoutStep === 3 ? 'active' : ''} ${checkoutStep < 3 ? 'locked' : ''}`}>
                <div className="step-header">
                  <div className="step-header-left">
                    <span className="step-number">3</span>
                    <div className="step-header-text">
                      <h3>Review & Place Order</h3>
                    </div>
                  </div>
                </div>

                {checkoutStep === 3 && (
                  <div className="step-content">
                    <div className="review-summary-panel" style={{ background: '#fdfcfc', border: '1px solid #eee', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
                      <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: '#666', lineHeight: '1.5' }}>
                        Please review your shipping and payment information below before clicking Place Order.
                      </p>
                      
                      <div className="review-summary-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="review-summary-box" style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
                          <h4 style={{ margin: '0 0 8px 0', color: 'var(--maroon)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Delivery Address</h4>
                          <p style={{ margin: 0, color: '#333' }}>
                            <strong>{formData.firstName} {formData.lastName}</strong><br />
                            {formData.address}<br />
                            {formData.city}, {formData.state} - {formData.zipCode}<br />
                            Phone: {formData.phone}
                          </p>
                        </div>
                        <div className="review-summary-box" style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
                          <h4 style={{ margin: '0 0 8px 0', color: 'var(--maroon)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Details</h4>
                          <p style={{ margin: 0, color: '#333' }}>
                            Method: <strong>{formData.paymentMethod === 'card' ? 'Credit/Debit Card (Stripe)' : 'Cash on Delivery (COD)'}</strong>
                          </p>
                        </div>
                      </div>
                    </div>

                    <button type="submit" className="btn-place-order" disabled={loading}>
                      {loading ? 'Processing...' : 'Place Order'}
                    </button>
                  </div>
                )}
              </div>
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
