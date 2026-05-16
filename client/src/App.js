import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import { fetchMe } from './store';
import { settingsAPI } from './utils/api';

// Public pages
import HomePage from './pages/HomePage';
import StoreFront from './pages/StoreFront';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Checkout';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmation from './pages/OrderConfirmation';
import ProfilePage from './pages/ProfilePage';
import WishlistPage from './pages/WishlistPage';
import ReturnRequestPage from './pages/ReturnRequestPage';
import ReturnStatusPage from './pages/ReturnStatusPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import TrackOrderPage from './pages/TrackOrderPage';
import FAQPage from './pages/FAQPage';
import ShippingPolicyPage from './pages/ShippingPolicyPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';

// Admin pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AddProduct from './pages/admin/AddProduct';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCategories from './pages/admin/AdminCategories';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminUsers from './pages/admin/AdminUsers';
import AdminSettings from './pages/admin/AdminSettings';
import AdminReturns from './pages/admin/AdminReturns';
import AdminReturnDetail from './pages/admin/AdminReturnDetail';
import AdminActivityLogs from './pages/admin/AdminActivityLogs';
import AdminInventory from './pages/admin/AdminInventory';
import AdminReviews from './pages/admin/AdminReviews';
import AdminFinancials from './pages/admin/AdminFinancials';
import AdminAnalytics from './pages/admin/AdminAnalytics';

// Auth pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

import CartDrawer from './components/CartDrawer';
import { closeCart } from './store';

const ProtectedAdmin = ({ children }) => {
  const { user, initialized } = useSelector(s => s.auth);
  if (!initialized) return <div className="loading-center"><div className="spinner spinner-lg" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!['admin', 'staff'].includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const ProtectedUser = ({ children }) => {
  const { user, initialized } = useSelector(s => s.auth);
  if (!initialized) return <div className="loading-center"><div className="spinner spinner-lg" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

export default function App() {
  const dispatch = useDispatch();
  
  useEffect(() => { 
    dispatch(fetchMe()); 
    
    // Inject Tracking Scripts
    settingsAPI.getSettings().then(res => {
      const { metaPixelId, googleAnalyticsId } = res.data || {};
      
      // Inject Meta Pixel
      if (metaPixelId && !window.fbq) {
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        window.fbq('init', metaPixelId);
        window.fbq('track', 'PageView');
      }

      // Inject Google Analytics
      if (googleAnalyticsId && !window.gtag) {
        const script = document.createElement('script');
        script.src = `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`;
        script.async = true;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        function gtag(){window.dataLayer.push(arguments);}
        window.gtag = gtag; // attach to window to avoid undefined errors
        gtag('js', new Date());
        gtag('config', googleAnalyticsId);
      }
    }).catch(err => console.error('Failed to load tracking settings:', err.message));
  }, [dispatch]);

  const { open: isCartOpen } = useSelector(s => s.cart);

  return (
    <BrowserRouter>
      <CartDrawer isOpen={isCartOpen} onClose={() => dispatch(closeCart())} />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<StoreFront />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
        <Route path="/profile" element={<ProtectedUser><ProfilePage /></ProtectedUser>} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/request-return" element={<ProtectedUser><ReturnRequestPage /></ProtectedUser>} />
        <Route path="/returns/:id" element={<ProtectedUser><ReturnStatusPage /></ProtectedUser>} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/track-order" element={<TrackOrderPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/shipping-policy" element={<ShippingPolicyPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />

        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedAdmin><AdminLayout /></ProtectedAdmin>}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/add" element={<AddProduct />} />
          <Route path="products/edit/:id" element={<AddProduct />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="returns" element={<AdminReturns />} />
          <Route path="returns/:id" element={<AdminReturnDetail />} />
          <Route path="activity-logs" element={<AdminActivityLogs />} />
          <Route path="inventory" element={<AdminInventory />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="financials" element={<AdminFinancials />} />
          <Route path="analytics" element={<AdminAnalytics />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        theme="light"
        toastStyle={{ background: '#ffffff', border: '1px solid #e5e2df', color: '#1a1a1a', fontFamily: "'DM Sans', sans-serif" }}
      />
    </BrowserRouter>
  );
}
