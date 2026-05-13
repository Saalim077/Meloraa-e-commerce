import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/pages.css';

export default function ShippingPolicyPage() {
  return (
    <div style={{ background: '#faf8f6', minHeight: '100vh' }}>
      <Header />
      <section className="page-hero">
        <h1>Shipping & Returns</h1>
        <p>Everything you need to know about delivery and returns</p>
        <div className="breadcrumb"><Link to="/">Home</Link> / Shipping & Returns</div>
      </section>

      <div className="page-container policy-content">
        <div className="content-section">
          <h2>Shipping Policy</h2>
          <h3>Delivery Timeframes</h3>
          <ul>
            <li><strong>Metro Cities:</strong> 3-5 business days</li>
            <li><strong>Tier 2 & 3 Cities:</strong> 5-7 business days</li>
            <li><strong>Remote Areas:</strong> 7-10 business days</li>
          </ul>
          <h3>Shipping Charges</h3>
          <ul>
            <li>Orders above ₹999: <strong>FREE shipping</strong></li>
            <li>Orders below ₹999: Flat ₹49 shipping fee</li>
          </ul>
          <h3>Order Processing</h3>
          <p>Orders placed before 2:00 PM IST are processed the same business day. Orders placed after 2:00 PM or on weekends/holidays will be processed the next business day.</p>
        </div>

        <div className="content-section">
          <h2>Return Policy</h2>
          <h3>7-Day Easy Returns</h3>
          <p>We want you to love every purchase. If you're not completely satisfied, you can return most items within 7 days of delivery for a full refund or exchange.</p>
          <h3>Return Conditions</h3>
          <ul>
            <li>Items must be unworn, unwashed, and in original condition</li>
            <li>All original tags and packaging must be intact</li>
            <li>Items must be returned within 7 days of delivery</li>
            <li>Sale items can only be exchanged, not refunded</li>
          </ul>
          <h3>How to Return</h3>
          <ol>
            <li>Log in to your account and go to <strong>Profile → Orders</strong></li>
            <li>Select the order and click <strong>"Request Return"</strong></li>
            <li>Choose your reason and preferred resolution (refund/exchange)</li>
            <li>Our team will arrange a pickup within 2-3 business days</li>
          </ol>
        </div>

        <div className="content-section">
          <h2>Refund Policy</h2>
          <p>Once we receive and inspect your returned item, we'll process your refund within 5-7 business days.</p>
          <ul>
            <li><strong>Credit/Debit Card:</strong> Refund to original card (5-7 days)</li>
            <li><strong>UPI:</strong> Refund to original UPI ID (2-3 days)</li>
            <li><strong>Net Banking:</strong> Refund to bank account (5-7 days)</li>
            <li><strong>COD:</strong> Refund via bank transfer (7-10 days)</li>
          </ul>
        </div>

        <div className="info-grid" style={{ marginTop: '20px' }}>
          <div className="info-card"><div className="card-icon">📦</div><h3>Free Pickup</h3><p>We'll pick up returns from your doorstep at no extra cost</p></div>
          <div className="info-card"><div className="card-icon">💰</div><h3>Quick Refunds</h3><p>Refunds processed within 5-7 business days</p></div>
          <div className="info-card"><div className="card-icon">🔄</div><h3>Easy Exchange</h3><p>Swap for a different size or color hassle-free</p></div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
