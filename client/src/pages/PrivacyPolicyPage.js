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

      <div className="page-container policy-content">
        <div className="content-section">
          <p className="policy-date">Last updated: May 2026</p>
          <p>At MELORAA, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or make a purchase.</p>
        </div>

        <div className="content-section">
          <h2>Information We Collect</h2>
          <h3>Personal Information</h3>
          <p>When you create an account or place an order, we collect:</p>
          <ul>
            <li>Name and email address</li>
            <li>Phone number</li>
            <li>Shipping and billing addresses</li>
            <li>Payment information (processed securely via third-party providers)</li>
          </ul>
          <h3>Usage Information</h3>
          <p>We automatically collect certain information when you visit our website, including browser type, IP address, pages visited, and time spent on pages.</p>
        </div>

        <div className="content-section">
          <h2>How We Use Your Information</h2>
          <ul>
            <li>Process and fulfill your orders</li>
            <li>Send order confirmations and shipping updates</li>
            <li>Respond to your inquiries and provide customer support</li>
            <li>Send promotional emails (with your consent)</li>
            <li>Improve our website and services</li>
            <li>Prevent fraudulent transactions</li>
          </ul>
        </div>

        <div className="content-section">
          <h2>Data Protection</h2>
          <p>We implement industry-standard security measures to protect your personal information:</p>
          <ul>
            <li>SSL/TLS encryption for all data transmission</li>
            <li>Secure payment processing through certified providers</li>
            <li>Regular security audits and updates</li>
            <li>Limited employee access to personal data</li>
          </ul>
        </div>

        <div className="content-section">
          <h2>Cookies</h2>
          <p>We use cookies to enhance your browsing experience, remember your preferences, and analyze website traffic. You can control cookie settings through your browser preferences.</p>
        </div>

        <div className="content-section">
          <h2>Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal data</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Opt out of marketing communications</li>
            <li>Withdraw consent at any time</li>
          </ul>
          <p style={{ marginTop: '16px' }}>To exercise any of these rights, please <Link to="/contact" style={{ color: '#4f0c10' }}>contact us</Link>.</p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
