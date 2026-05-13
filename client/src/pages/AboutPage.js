import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/pages.css';

export default function AboutPage() {
  return (
    <div style={{ background: '#faf8f6', minHeight: '100vh' }}>
      <Header />
      <section className="page-hero">
        <h1>About MELORAA</h1>
        <p>Our story, our passion, our promise</p>
        <div className="breadcrumb"><Link to="/">Home</Link> / About Us</div>
      </section>

      <div className="page-container">
        {/* Our Story */}
        <div className="content-section">
          <h2>Our Story</h2>
          <p>MELORAA was born from a simple belief — that premium fashion should be accessible to everyone. Founded with a passion for bringing the finest western wear to the modern Indian wardrobe, we've grown from a small idea into a brand that thousands of customers trust and love.</p>
          <p style={{ marginTop: '16px' }}>Every piece in our collection is carefully curated to blend contemporary global trends with timeless elegance. We believe that what you wear is an expression of who you are, and we're here to help you make that statement with confidence.</p>
        </div>

        {/* Mission & Vision */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '30px' }}>
          <div className="content-section" style={{ marginBottom: 0 }}>
            <h2>Our Mission</h2>
            <p>To deliver premium quality western wear that empowers individuals to express their unique style. We strive to make fashion that's not just beautiful, but sustainable and responsibly crafted.</p>
          </div>
          <div className="content-section" style={{ marginBottom: 0 }}>
            <h2>Our Vision</h2>
            <p>To become India's most trusted premium fashion destination, known for exceptional quality, innovative designs, and an unwavering commitment to customer satisfaction.</p>
          </div>
        </div>

        {/* Values */}
        <div className="section-heading" style={{ marginTop: '60px' }}>
          <h2>What Sets Us Apart</h2>
          <p>The values that drive everything we do</p>
          <div className="section-divider" />
        </div>

        <div className="info-grid">
          <div className="info-card">
            <div className="card-icon">🎯</div>
            <h3>Quality First</h3>
            <p>Every garment undergoes rigorous quality checks before reaching you. We never compromise on materials or craftsmanship.</p>
          </div>
          <div className="info-card">
            <div className="card-icon">🌿</div>
            <h3>Sustainable Practices</h3>
            <p>From eco-friendly packaging to responsible sourcing, we're committed to minimizing our environmental footprint.</p>
          </div>
          <div className="info-card">
            <div className="card-icon">🤝</div>
            <h3>Customer Obsessed</h3>
            <p>Your satisfaction is our top priority. From easy returns to responsive support, we're always here for you.</p>
          </div>
          <div className="info-card">
            <div className="card-icon">✂️</div>
            <h3>Original Designs</h3>
            <p>Our in-house design team creates exclusive pieces that blend global fashion trends with Indian sensibilities.</p>
          </div>
          <div className="info-card">
            <div className="card-icon">📦</div>
            <h3>Fast & Free Shipping</h3>
            <p>We deliver across India with free shipping on orders above ₹999. Most orders reach you within 3-5 business days.</p>
          </div>
          <div className="info-card">
            <div className="card-icon">🔒</div>
            <h3>Secure Shopping</h3>
            <p>Shop with confidence. All transactions are encrypted and your personal data is always protected.</p>
          </div>
        </div>

        {/* CTA */}
        <div className="cta-banner">
          <h2>Ready to Explore?</h2>
          <p>Discover our latest collection and find your perfect style</p>
          <Link to="/shop" className="btn-cta">Shop Now</Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
