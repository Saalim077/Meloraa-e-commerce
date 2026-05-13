import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/pages.css';

export default function TermsPage() {
  return (
    <div style={{ background: '#faf8f6', minHeight: '100vh' }}>
      <Header />
      <section className="page-hero">
        <h1>Terms & Conditions</h1>
        <p>Please read these terms carefully before using our services</p>
        <div className="breadcrumb"><Link to="/">Home</Link> / Terms & Conditions</div>
      </section>

      <div className="page-container policy-content">
        <div className="content-section">
          <p className="policy-date">Last updated: May 2026</p>
          <p>Welcome to MELORAA. By accessing and using this website, you accept and agree to be bound by the terms and conditions outlined below.</p>
        </div>

        <div className="content-section">
          <h2>1. General Terms</h2>
          <p>By accessing this website, you confirm that you are at least 18 years old or have the consent of a parent or guardian. We reserve the right to refuse service to anyone for any reason at any time.</p>
        </div>

        <div className="content-section">
          <h2>2. Products & Pricing</h2>
          <ul>
            <li>All product images are for illustrative purposes. Actual colors may vary slightly due to screen settings.</li>
            <li>Prices are in Indian Rupees (₹) and inclusive of GST unless stated otherwise.</li>
            <li>We reserve the right to modify prices at any time without prior notice.</li>
            <li>In case of pricing errors, we reserve the right to cancel affected orders.</li>
          </ul>
        </div>

        <div className="content-section">
          <h2>3. Orders & Payment</h2>
          <ul>
            <li>An order is confirmed only after successful payment or COD acceptance.</li>
            <li>We reserve the right to limit order quantities.</li>
            <li>Orders may be cancelled if items are out of stock.</li>
            <li>All payment information is processed securely through third-party payment gateways.</li>
          </ul>
        </div>

        <div className="content-section">
          <h2>4. Intellectual Property</h2>
          <p>All content on this website, including logos, images, text, graphics, and software, is the property of MELORAA and protected by intellectual property laws. Unauthorized use, reproduction, or distribution is strictly prohibited.</p>
        </div>

        <div className="content-section">
          <h2>5. User Accounts</h2>
          <ul>
            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
            <li>You agree to provide accurate and complete information when creating an account.</li>
            <li>You are responsible for all activities that occur under your account.</li>
            <li>We reserve the right to terminate accounts that violate these terms.</li>
          </ul>
        </div>

        <div className="content-section">
          <h2>6. Limitation of Liability</h2>
          <p>MELORAA shall not be liable for any indirect, incidental, special, or consequential damages arising from the use or inability to use our services, even if we have been advised of the possibility of such damages.</p>
        </div>

        <div className="content-section">
          <h2>7. Governing Law</h2>
          <p>These terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra.</p>
        </div>

        <div className="content-section">
          <h2>8. Contact</h2>
          <p>For any questions about these terms, please <Link to="/contact" style={{ color: '#4f0c10' }}>contact us</Link> or email us at <strong>legal@meloraa.com</strong>.</p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
