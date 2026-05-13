import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { removeFromCart, updateQty } from '../store';
import api from '../utils/api';
import Header from '../components/Header';
import '../styles/cart.css';

export default function Cart() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector(state => state.cart.items);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    taxEnabled: true,
    taxRate: 0,
    taxLabel: 'Tax',
    shippingEnabled: true,
    standardShippingCost: 99,
    freeShippingThreshold: 1000
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get(`/settings?t=${new Date().getTime()}`);
      console.log('API FETCHED SETTINGS:', data);
      setSettings(data);
    } catch (error) {
      console.warn('Failed to fetch tax settings', error);
    }
  };

  const removeItem = (productId, variant) => {
    const item = cartItems.find(i => i.productId === productId && i.variant === variant);
    if (item) {
      dispatch(removeFromCart(item._id));
      toast.success('Item removed from cart');
    }
  };

  const handleUpdateQuantity = (productId, variant, newQuantity) => {
    if (newQuantity < 1) {
      removeItem(productId, variant);
      return;
    }

    const item = cartItems.find(i => i.productId === productId && i.variant === variant);
    if (item) {
      dispatch(updateQty({ id: item._id, qty: newQuantity }));
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  let calculatedTax = 0;
  if (settings.taxEnabled) {
    cartItems.forEach(item => {
      let rate = settings.taxRate || 0;
      if (item.taxClass && settings.taxClasses && Array.isArray(settings.taxClasses)) {
        const found = settings.taxClasses.find(c => c.name === item.taxClass);
        if (found) rate = found.rate;
      }
      calculatedTax += (item.price * item.quantity) * (rate / 100);
    });
  }

  const shipping = settings.shippingEnabled
    ? (Number(subtotal) > Number(settings.freeShippingThreshold || 1000) ? 0 : Number(settings.standardShippingCost || 99))
    : 0;

  const taxableAmount = subtotal + shipping;
  let taxMultiplier = 1;
  if (subtotal > 0) {
    taxMultiplier = taxableAmount / subtotal;
  }
  const tax = settings.taxEnabled ? calculatedTax * taxMultiplier : 0;
  const total = taxableAmount + tax;

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    navigate('/checkout'); // Fixed route to point to the actual checkout page
  };

  return (
    <>
      <Header />
      <div className="cart-page">
        <div className="cart-container">
          <h1>Shopping Cart</h1>

          {cartItems.length === 0 ? (
            <div className="empty-cart">
              <p>Your cart is empty</p>
              <Link to="/" className="btn-continue-shopping">Continue Shopping</Link>
            </div>
          ) : (
            <div className="cart-layout">
              {/* Cart Items */}
              <div className="cart-items">
                {cartItems.map(item => (
                  <div key={`${item.productId}-${item.variant || 'default'}`} className="cart-item">
                    <img src={item.image || '/placeholder.jpg'} alt={item.name} className="item-image" />

                    <div className="item-details">
                      <h3>
                        {item.name}
                        {item.variant && <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginTop: '4px', fontWeight: 'normal' }}>Variant: {item.variant}</span>}
                      </h3>
                      <p className="item-price">₹{item.price.toLocaleString('en-IN')}</p>
                    </div>

                    <div className="item-quantity">
                      <button onClick={() => handleUpdateQuantity(item.productId, item.variant, item.quantity - 1)}>−</button>
                      <input type="number" value={item.quantity} readOnly />
                      <button onClick={() => handleUpdateQuantity(item.productId, item.variant, item.quantity + 1)}>+</button>
                    </div>

                    <div className="item-total">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </div>

                    <button
                      className="btn-remove"
                      onClick={() => removeItem(item.productId, item.variant)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="cart-summary">
                <h2>Order Summary</h2>

                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>

                <div className="summary-row">
                  <span>{settings.taxLabel || 'Tax'}:</span>
                  <span>₹{tax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>

                <div className="summary-row">
                  <span>Shipping:</span>
                  <span>{shipping === 0 ? 'Free' : `₹${shipping.toLocaleString('en-IN')}`}</span>
                </div>

                <div className="summary-row total">
                  <span>Total:</span>
                  <span>₹{total.toLocaleString('en-IN')}</span>
                </div>

                <button
                  className="btn-checkout"
                  onClick={handleCheckout}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Proceed to Checkout'}
                </button>

                <Link to="/" className="btn-continue-shopping-link">
                  Continue Shopping
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
