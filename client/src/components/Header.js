import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FiSearch, FiUser, FiHeart, FiShoppingBag, FiGrid } from 'react-icons/fi';
import { openCart } from '../store';
import '../styles/header.css';

export default function Header() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items } = useSelector(state => state.cart);
  const totalItems = (items || []).reduce((acc, item) => acc + item.quantity, 0);

  return (
    <>
      <div className="header-topbar-premium">
        FREE SHIPPING ON ALL ORDERS ABOVE ₹999
      </div>
      <header className="header-premium">
        <div className="container">
          <div className="header-grid-premium">
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
              <div className="header-icon-btn"><FiSearch /></div>
              <Link to="/profile" className="header-icon-btn"><FiUser /></Link>
              <Link to="/wishlist" className="header-icon-btn"><FiHeart /></Link>
              <div className="header-icon-btn" onClick={() => dispatch(openCart())}>
                <FiShoppingBag />
                {totalItems > 0 && <span className="cart-badge-premium">{totalItems}</span>}
              </div>
              <div className="header-icon-btn"><FiGrid /></div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
