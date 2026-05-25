import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { openCart } from '../store';
import '../styles/footer.css';
import { settingsAPI } from '../utils/api';

export default function Footer() {
  const [settings, setSettings] = useState(null);
  const dispatch = useDispatch();
  const location = useLocation();
  const cartItems = useSelector(s => s.cart.items);
  const wishlistItems = useSelector(s => s.wishlist.items);
  const { user } = useSelector(s => s.auth);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlistItems.length;

  useEffect(() => {
    settingsAPI.getSettings()
      .then(res => setSettings(res.data))
      .catch(err => console.error('Failed to load settings in footer:', err));
  }, []);

  const getActiveClass = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <>
      <footer className="footer-premium">
        <div className="container">
          <div className="footer-grid-premium">
            {/* Column 1: Newsletter */}
            <div className="footer-col-premium newsletter-col">
              <h4 className="footer-title-premium">NEWSLETTER</h4>
              <p className="footer-desc-premium">
                Subscribe To Newsletter & Be The First To Know About New Arrivals, Exciting Launches
              </p>
              <form className="footer-newsletter-stacked" onSubmit={e => e.preventDefault()}>
                <input type="email" placeholder="Email address" required />
                <button type="submit" className="btn-footer-subscribe">SUBSCRIBE</button>
              </form>
            </div>

            {/* Column 2: Stay Connected */}
            <div className="footer-col-premium">
              <h4 className="footer-title-premium">Stay Connected</h4>
              <ul className="footer-links-premium social-links-list">
                <li><a href="#"><i className="fab fa-facebook-f"></i> Facebook</a></li>
                <li><a href="#"><i className="fab fa-instagram"></i> Instagram</a></li>
                <li><a href="#"><i className="fab fa-linkedin-in"></i> Linkedin</a></li>
                <li><a href="#"><i className="fab fa-youtube"></i> YouTube</a></li>
              </ul>
            </div>

            {/* Column 3: Customer Service */}
            <div className="footer-col-premium">
              <h4 className="footer-title-premium">Customer Service</h4>
              <ul className="footer-links-premium">
                <li><Link to="/profile">My Account</Link></li>
                <li><Link to="/returns">Return</Link></li>
                <li><Link to="/returns">Return Policy</Link></li>
                <li><Link to="/orders">Track Order</Link></li>
                <li><Link to="/privacy-policy">Privacy Policy</Link></li>
              </ul>
            </div>

            {/* Column 4: Information */}
            <div className="footer-col-premium">
              <h4 className="footer-title-premium">Information</h4>
              <ul className="footer-links-premium">
                <li><Link to="/about">About Us</Link></li>
                <li><Link to="/stores">Our Stores</Link></li>
                <li><Link to="/journal">Blogs</Link></li>
              </ul>
            </div>

            {/* Column 5: About Us */}
            <div className="footer-col-premium about-col">
              <h4 className="footer-title-premium">About Us</h4>
              <div className="footer-logo-wrap">
                 <h2 className="footer-brand-name">MELORAA</h2>
              </div>
              <div className="footer-contact-info">
                <p><strong>Phone:</strong><br />{settings?.contactPhone || '0120-420-0222'}</p>
                <p><strong>Email:</strong><br />{settings?.contactEmail || 'customercare@meloraa.com'}</p>
              </div>
            </div>
          </div>

          <div className="footer-bottom-premium">
            <p>© ALL RIGHTS RESERVED BY MELORAA FASHION PVT LTD</p>
          </div>
        </div>
      </footer>

      {/* Sticky Mobile Bottom Navigation Bar */}
      <div className="mobile-bottom-nav">
        <Link to="/" className={`mobile-bottom-nav-item ${getActiveClass('/')}`}>
          <span className="mobile-nav-icon"><i className="fas fa-home"></i></span>
          <span className="mobile-nav-label">Home</span>
        </Link>
        <Link to="/shop" className={`mobile-bottom-nav-item ${getActiveClass('/shop')}`}>
          <span className="mobile-nav-icon"><i className="fas fa-store"></i></span>
          <span className="mobile-nav-label">Shop</span>
        </Link>
        <Link to="/wishlist" className={`mobile-bottom-nav-item ${getActiveClass('/wishlist')}`}>
          <div className="mobile-nav-icon-wrap">
            <span className="mobile-nav-icon"><i className="fas fa-heart"></i></span>
            {wishlistCount > 0 && <span className="mobile-nav-badge">{wishlistCount}</span>}
          </div>
          <span className="mobile-nav-label">Wishlist</span>
        </Link>
        <button onClick={() => dispatch(openCart())} className="mobile-bottom-nav-item btn-unstyled-nav">
          <div className="mobile-nav-icon-wrap">
            <span className="mobile-nav-icon"><i className="fas fa-shopping-bag"></i></span>
            {cartCount > 0 && <span className="mobile-nav-badge">{cartCount}</span>}
          </div>
          <span className="mobile-nav-label">Cart</span>
        </button>
        <Link to={user ? "/profile" : "/login"} className={`mobile-bottom-nav-item ${getActiveClass('/profile') || getActiveClass('/login')}`}>
          <span className="mobile-nav-icon"><i className="fas fa-user"></i></span>
          <span className="mobile-nav-label">Account</span>
        </Link>
      </div>
    </>
  );
}
