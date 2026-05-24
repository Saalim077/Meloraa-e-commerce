import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FiSearch, FiUser, FiHeart, FiShoppingBag, FiMenu, FiX } from 'react-icons/fi';
import { openCart } from '../store';
import '../styles/header.css';

export default function Header() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items } = useSelector(state => state.cart);
  const totalItems = (items || []).reduce((acc, item) => acc + item.quantity, 0);

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setMenuOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      <div className="header-topbar-premium">
        FREE SHIPPING ON ALL ORDERS ABOVE ₹999
      </div>
      <header className="header-premium">
        <div className="container">
          <div className="header-grid-premium">
            {/* Mobile Menu Toggle */}
            <button className="header-menu-toggle" onClick={() => setMenuOpen(true)} aria-label="Open Menu">
              <FiMenu />
            </button>

            <nav className="header-nav-premium">
              <ul style={{ display: 'flex', gap: '32px', listStyle: 'none' }}>
                <li><Link to="/shop">SHOP</Link></li>
                <li><Link to="/shop?sort=-createdAt">NEW ARRIVALS</Link></li>
                <li><Link to="/about">OUR STORY</Link></li>
                <li><Link to="/shop?category=sale" className="sale-link">SALE</Link></li>
              </ul>
            </nav>

            <Link to="/" className="header-logo-premium">MELORAA</Link>

            <div className="header-icons-premium">
              <div className="header-icon-btn search-icon-btn" onClick={() => setSearchOpen(true)}>
                <FiSearch />
              </div>
              <Link to="/profile" className="header-icon-btn user-icon-btn"><FiUser /></Link>
              <Link to="/wishlist" className="header-icon-btn wishlist-icon-btn"><FiHeart /></Link>
              <div className="header-icon-btn cart-btn" onClick={() => dispatch(openCart())}>
                <FiShoppingBag />
                {totalItems > 0 && <span className="cart-badge-premium">{totalItems}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Search Overlay */}
        {searchOpen && (
          <div className="desktop-search-bar-overlay">
            <div className="container">
              <form onSubmit={handleSearchSubmit} className="desktop-search-form">
                <FiSearch className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus 
                />
                <button type="button" className="close-search-btn" onClick={() => setSearchOpen(false)}>
                  <FiX />
                </button>
              </form>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Drawer Menu */}
      <div className={`mobile-nav-overlay ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)}>
        <div className={`mobile-nav-drawer ${menuOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()}>
          <div className="mobile-nav-header">
            <Link to="/" className="mobile-nav-logo" onClick={() => setMenuOpen(false)}>MELORAA</Link>
            <button className="mobile-nav-close" onClick={() => setMenuOpen(false)} aria-label="Close Menu">
              <FiX />
            </button>
          </div>

          <div className="mobile-nav-search-container">
            <form onSubmit={handleSearchSubmit} className="mobile-nav-search-form">
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" aria-label="Search"><FiSearch /></button>
            </form>
          </div>

          <ul className="mobile-nav-links">
            <li><Link to="/shop" onClick={() => setMenuOpen(false)}>SHOP</Link></li>
            <li><Link to="/shop?sort=-createdAt" onClick={() => setMenuOpen(false)}>NEW ARRIVALS</Link></li>
            <li><Link to="/about" onClick={() => setMenuOpen(false)}>OUR STORY</Link></li>
            <li><Link to="/shop?category=sale" className="sale-link" onClick={() => setMenuOpen(false)}>SALE</Link></li>
          </ul>

          <div className="mobile-nav-divider"></div>

          <ul className="mobile-nav-user-links">
            <li>
              <Link to="/profile" onClick={() => setMenuOpen(false)}>
                <FiUser /> Account Profile
              </Link>
            </li>
            <li>
              <Link to="/wishlist" onClick={() => setMenuOpen(false)}>
                <FiHeart /> Wishlist
              </Link>
            </li>
          </ul>

          <div className="mobile-nav-footer">
            <p><strong>Customer Service</strong></p>
            <p>customercare@meloraa.com</p>
            <p>0120-420-0222</p>
          </div>
        </div>
      </div>
    </>
  );
}

