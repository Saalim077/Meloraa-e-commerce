import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/pages.css';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      toast.success('Message sent! We\'ll get back to you within 24 hours.');
      setForm({ name: '', email: '', subject: '', message: '' });
      setSending(false);
    }, 1000);
  };

  return (
    <div style={{ background: '#faf8f6', minHeight: '100vh' }}>
      <Header />
      <section className="page-hero">
        <h1>Contact Us</h1>
        <p>We'd love to hear from you</p>
        <div className="breadcrumb"><Link to="/">Home</Link> / Contact</div>
      </section>

      <div className="page-container" style={{ maxWidth: '1200px' }}>
        <div className="contact-grid">
          {/* Form */}
          <div className="contact-form">
            <h2>Send us a Message</h2>
            <p>Fill out the form and our team will respond within 24 hours.</p>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Your Name</label>
                  <input type="text" placeholder="John Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" placeholder="john@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label>Subject</label>
                <select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required>
                  <option value="">Select a subject</option>
                  <option value="order">Order Inquiry</option>
                  <option value="product">Product Question</option>
                  <option value="return">Returns & Refunds</option>
                  <option value="feedback">Feedback</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea placeholder="Tell us how we can help..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required />
              </div>
              <button type="submit" className="btn-submit" disabled={sending}>
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>

          {/* Info */}
          <div>
            <div className="info-card" style={{ marginBottom: '20px', textAlign: 'left' }}>
              <div className="card-icon" style={{ margin: '0 0 16px' }}>📧</div>
              <h3>Email</h3>
              <p style={{ marginTop: '8px' }}>support@meloraa.com</p>
              <p>For orders: orders@meloraa.com</p>
            </div>
            <div className="info-card" style={{ marginBottom: '20px', textAlign: 'left' }}>
              <div className="card-icon" style={{ margin: '0 0 16px' }}>📞</div>
              <h3>Phone</h3>
              <p style={{ marginTop: '8px' }}>+91 98765 43210</p>
              <p>Mon - Sat: 10:00 AM - 7:00 PM IST</p>
            </div>
            <div className="info-card" style={{ textAlign: 'left' }}>
              <div className="card-icon" style={{ margin: '0 0 16px' }}>📍</div>
              <h3>Office Address</h3>
              <p style={{ marginTop: '8px' }}>MELORAA Fashion Pvt. Ltd.</p>
              <p>Mumbai, Maharashtra, India</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
