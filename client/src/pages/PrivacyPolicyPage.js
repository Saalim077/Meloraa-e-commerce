import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/pages.css';

export default function PrivacyPolicyPage() {
  return (
    <div style={{ background: '#faf8f6', minHeight: '100vh' }}>
      <Header />
      <section className="page-hero">
        <h1>Privacy Policy</h1>
        <p>How we protect your personal information</p>
        <div className="breadcrumb"><Link to="/">Home</Link> / Privacy Policy</div>
      </section>

      <div className="page-container policy-content" style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 24px' }}>
        <div className="content-section" style={{ background: 'white', padding: '40px', borderRadius: '12px', border: '1px solid #f0ebe4', boxShadow: '0 4px 20px rgba(79, 12, 16, 0.02)', marginBottom: '30px' }}>
          <p className="policy-date" style={{ color: 'var(--maroon)', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.1em', marginBottom: '20px' }}>Last updated: May 24, 2026</p>
          <p style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#444' }}>
            Welcome to Meloraa. At Meloraa, we respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you visit or make a purchase from our website.
          </p>
        </div>

        <div className="content-section" style={{ background: 'white', padding: '40px', borderRadius: '12px', border: '1px solid #f0ebe4', boxShadow: '0 4px 20px rgba(79, 12, 16, 0.02)', marginBottom: '30px' }}>
          <h2 style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)', fontSize: '1.6rem', marginBottom: '24px', borderBottom: '1px solid #f0ebe4', paddingBottom: '12px' }}>1. Information We Collect</h2>
          
          <h3 style={{ fontSize: '1.15rem', color: '#1a1a1a', marginTop: '20px', marginBottom: '10px', fontWeight: '600' }}>Personal Information</h3>
          <ul style={{ paddingLeft: '20px', lineHeight: '1.8', color: '#555', marginBottom: '20px' }}>
            <li>Name</li>
            <li>Email address</li>
            <li>Phone number</li>
            <li>Billing & shipping address</li>
          </ul>

          <h3 style={{ fontSize: '1.15rem', color: '#1a1a1a', marginTop: '20px', marginBottom: '10px', fontWeight: '600' }}>Order Information</h3>
          <ul style={{ paddingLeft: '20px', lineHeight: '1.8', color: '#555', marginBottom: '20px' }}>
            <li>Products purchased</li>
            <li>Payment details (processed securely via third-party gateways)</li>
          </ul>

          <h3 style={{ fontSize: '1.15rem', color: '#1a1a1a', marginTop: '20px', marginBottom: '10px', fontWeight: '600' }}>Technical Data</h3>
          <ul style={{ paddingLeft: '20px', lineHeight: '1.8', color: '#555' }}>
            <li>IP address</li>
            <li>Browser type</li>
            <li>Device information</li>
            <li>Cookies & usage data</li>
          </ul>
        </div>

        <div className="content-section" style={{ background: 'white', padding: '40px', borderRadius: '12px', border: '1px solid #f0ebe4', boxShadow: '0 4px 20px rgba(79, 12, 16, 0.02)', marginBottom: '30px' }}>
          <h2 style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)', fontSize: '1.6rem', marginBottom: '24px', borderBottom: '1px solid #f0ebe4', paddingBottom: '12px' }}>2. How We Use Your Information</h2>
          <ul style={{ paddingLeft: '20px', lineHeight: '1.8', color: '#555' }}>
            <li>Process and deliver your orders</li>
            <li>Communicate with you (order updates, support)</li>
            <li>Improve our website and services</li>
            <li>Send promotional offers (only if you opt-in)</li>
            <li>Prevent fraud and ensure security</li>
          </ul>
        </div>

        <div className="content-section" style={{ background: 'white', padding: '40px', borderRadius: '12px', border: '1px solid #f0ebe4', boxShadow: '0 4px 20px rgba(79, 12, 16, 0.02)', marginBottom: '30px' }}>
          <h2 style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)', fontSize: '1.6rem', marginBottom: '24px', borderBottom: '1px solid #f0ebe4', paddingBottom: '12px' }}>3. Payment Security</h2>
          <p style={{ lineHeight: '1.7', color: '#555' }}>
            We do not store your payment details. All payments are processed securely via trusted payment gateways (like Razorpay, Stripe, etc.).
          </p>
        </div>

        <div className="content-section" style={{ background: 'white', padding: '40px', borderRadius: '12px', border: '1px solid #f0ebe4', boxShadow: '0 4px 20px rgba(79, 12, 16, 0.02)', marginBottom: '30px' }}>
          <h2 style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)', fontSize: '1.6rem', marginBottom: '24px', borderBottom: '1px solid #f0ebe4', paddingBottom: '12px' }}>4. Cookies</h2>
          <p style={{ lineHeight: '1.7', color: '#555' }}>
            We use cookies to improve website performance, remember user preferences, and analyze traffic. You can disable cookies in your browser settings.
          </p>
        </div>

        <div className="content-section" style={{ background: 'white', padding: '40px', borderRadius: '12px', border: '1px solid #f0ebe4', boxShadow: '0 4px 20px rgba(79, 12, 16, 0.02)', marginBottom: '30px' }}>
          <h2 style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)', fontSize: '1.6rem', marginBottom: '24px', borderBottom: '1px solid #f0ebe4', paddingBottom: '12px' }}>5. Sharing Your Information</h2>
          <p style={{ lineHeight: '1.7', color: '#555', marginBottom: '16px' }}>
            We do not sell your personal data. We may share your information with:
          </p>
          <ul style={{ paddingLeft: '20px', lineHeight: '1.8', color: '#555' }}>
            <li>Payment providers</li>
            <li>Shipping partners</li>
            <li>Legal authorities (if required by law)</li>
          </ul>
        </div>

        <div className="content-section" style={{ background: 'white', padding: '40px', borderRadius: '12px', border: '1px solid #f0ebe4', boxShadow: '0 4px 20px rgba(79, 12, 16, 0.02)', marginBottom: '30px' }}>
          <h2 style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)', fontSize: '1.6rem', marginBottom: '24px', borderBottom: '1px solid #f0ebe4', paddingBottom: '12px' }}>6. Data Protection</h2>
          <p style={{ lineHeight: '1.7', color: '#555' }}>
            We take appropriate security measures to protect your data from unauthorized access, misuse, or disclosure.
          </p>
        </div>

        <div className="content-section" style={{ background: 'white', padding: '40px', borderRadius: '12px', border: '1px solid #f0ebe4', boxShadow: '0 4px 20px rgba(79, 12, 16, 0.02)', marginBottom: '30px' }}>
          <h2 style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)', fontSize: '1.6rem', marginBottom: '24px', borderBottom: '1px solid #f0ebe4', paddingBottom: '12px' }}>7. Your Rights</h2>
          <ul style={{ paddingLeft: '20px', lineHeight: '1.8', color: '#555' }}>
            <li>Access your personal data</li>
            <li>Request correction or deletion</li>
            <li>Opt-out of marketing emails</li>
          </ul>
        </div>

        <div className="content-section" style={{ background: 'white', padding: '40px', borderRadius: '12px', border: '1px solid #f0ebe4', boxShadow: '0 4px 20px rgba(79, 12, 16, 0.02)', marginBottom: '30px' }}>
          <h2 style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)', fontSize: '1.6rem', marginBottom: '24px', borderBottom: '1px solid #f0ebe4', paddingBottom: '12px' }}>8. Third-Party Links</h2>
          <p style={{ lineHeight: '1.7', color: '#555' }}>
            Our website may contain links to third-party websites. We are not responsible for their privacy practices.
          </p>
        </div>

        <div className="content-section" style={{ background: 'white', padding: '40px', borderRadius: '12px', border: '1px solid #f0ebe4', boxShadow: '0 4px 20px rgba(79, 12, 16, 0.02)', marginBottom: '30px' }}>
          <h2 style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)', fontSize: '1.6rem', marginBottom: '24px', borderBottom: '1px solid #f0ebe4', paddingBottom: '12px' }}>9. Changes to This Policy</h2>
          <p style={{ lineHeight: '1.7', color: '#555' }}>
            We may update this Privacy Policy from time to time. Changes will be posted on this page.
          </p>
        </div>

        <div className="content-section" style={{ background: 'white', padding: '40px', borderRadius: '12px', border: '1px solid #f0ebe4', boxShadow: '0 4px 20px rgba(79, 12, 16, 0.02)', marginBottom: '30px' }}>
          <h2 style={{ color: 'var(--maroon)', fontFamily: 'var(--font-display)', fontSize: '1.6rem', marginBottom: '24px', borderBottom: '1px solid #f0ebe4', paddingBottom: '12px' }}>10. Contact Us</h2>
          <p style={{ lineHeight: '1.7', color: '#555', marginBottom: '12px' }}>
            If you have any questions, contact us:
          </p>
          <div style={{ background: '#fcfaf7', border: '1px solid #f0ebe4', padding: '20px', borderRadius: '8px', lineHeight: '1.8', color: '#444' }}>
            <p style={{ margin: '0 0 8px' }}><strong>Email:</strong> <a href="mailto:help@shopmeloraa.com" style={{ color: 'var(--maroon)', textDecoration: 'none' }}>help@shopmeloraa.com</a></p>
            <p style={{ margin: '0' }}><strong>Address:</strong> D-64, first floor Okhla Phase 1, New Delhi - 110020</p>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '40px', color: '#888', fontSize: '0.9rem' }}>
          <p>By using our website, you agree to this Privacy Policy.</p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
