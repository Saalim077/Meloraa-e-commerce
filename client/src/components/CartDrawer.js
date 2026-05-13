import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { removeFromCart, updateQty, closeCart } from '../store';
import '../styles/cartDrawer.css';

export default function CartDrawer({ isOpen, onClose }) {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const cartItems = useSelector(state => state.cart.items);

    const removeItem = (productId, variant) => {
        // Find the specific cart item ID since Redux uses `_id` and adds items uniquely
        const item = cartItems.find(i => i.productId === productId && i.variant === variant);
        if (item) {
            dispatch(removeFromCart(item._id));
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

    const handleCheckoutClick = () => {
        dispatch(closeCart());
        navigate('/checkout');
    };

    const handleViewCartClick = () => {
        dispatch(closeCart());
        navigate('/cart');
    };

    return (
        <>
            {/* Overlay */}
            <div
                className={`cart-drawer-overlay ${isOpen ? 'open' : ''}`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div className={`cart-drawer ${isOpen ? 'open' : ''}`}>

                {/* Header */}
                <div className="cart-drawer-header">
                    <h2>Shopping Cart {cartItems.length > 0 && <span className="cart-count">({cartItems.length})</span>}</h2>
                    <button className="cart-close-btn" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {/* Body / Items List */}
                <div className="cart-drawer-body">
                    {cartItems.length === 0 ? (
                        <div className="cart-drawer-empty">
                            <p>Your shopping cart is empty.</p>
                            <button className="btn-continue" onClick={onClose}>Continue Shopping</button>
                        </div>
                    ) : (
                        <div className="cart-drawer-items">
                            {cartItems.map((item) => (
                                <div key={`${item.productId}-${item.variant || 'default'}`} className="cart-drawer-item">
                                    <div className="cart-drawer-item-img">
                                        <img src={item.image || '/placeholder.jpg'} alt={item.name} />
                                    </div>

                                    <div className="cart-drawer-item-details">
                                        <Link to={`/product/${item.slug}`} className="cart-drawer-item-name" onClick={onClose}>
                                            {item.name} {item.variant && `- ${item.variant}`}
                                        </Link>

                                        {/* Add color/size attributes if they exist on the variant, or just the variant string */}
                                        {item.attributes && item.attributes.map(attr => (
                                            <div key={attr.name} className="cart-drawer-item-attr">
                                                <strong>{attr.name}:</strong> {attr.value}
                                            </div>
                                        ))}
                                        {!item.attributes && item.variant && (
                                            <div className="cart-drawer-item-attr">
                                                <strong>Variant:</strong> {item.variant}
                                            </div>
                                        )}

                                        <div className="cart-drawer-item-price-qty">
                                            <div className="cart-drawer-qty-control">
                                                <button onClick={() => handleUpdateQuantity(item.productId, item.variant, item.quantity - 1)}>-</button>
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => handleUpdateQuantity(item.productId, item.variant, parseInt(e.target.value) || 1)}
                                                    min="1"
                                                />
                                                <button onClick={() => handleUpdateQuantity(item.productId, item.variant, item.quantity + 1)}>+</button>
                                            </div>
                                            <div className="cart-drawer-price">
                                                ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                                            </div>
                                        </div>
                                    </div>

                                    <button className="cart-drawer-item-remove" onClick={() => removeItem(item.productId, item.variant)} title="Remove item">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <line x1="15" y1="9" x2="9" y2="15"></line>
                                            <line x1="9" y1="9" x2="15" y2="15"></line>
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {cartItems.length > 0 && (
                    <div className="cart-drawer-footer">
                        <div className="cart-drawer-subtotal">
                            <span>Subtotal:</span>
                            <span>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div className="cart-drawer-actions">
                            <button className="cart-drawer-btn-view" onClick={handleViewCartClick}>
                                VIEW CART
                            </button>
                            <button className="cart-drawer-btn-checkout" onClick={handleCheckoutClick}>
                                CHECKOUT
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </>
    );
}
