import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { settingsAPI } from '../utils/api';
import '../styles/pages.css';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    settingsAPI.getSettings()
      .then(res => {
        setSettings(res.data);
      })
      .catch(err => {
        console.error('Failed to load settings:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      toast.success('Message sent! We\'ll get back to you within 24 hours.');
      setForm({ name: '', email: '', subject: '', message: '' });
      setSending(false);
    }, 1000);
  };

  const getEmbedUrl = (input) => {
    if (!input) return '';
    if (input.includes('src=')) {
      const match = input.match(/src=["']([^"']+)["']/);
      return match ? match[1] : '';
    }
    return input;
  };

  if (loading) {
    return (
      <div style={{ background: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div className="spinner spinner-lg" style={{ borderTopColor: 'var(--maroon)' }} />
        </div>
        <Footer />
      </div>
    );
  }

  const emailVal = settings?.contactEmail || 'support@meloraa.com';
  const emails = emailVal.split(',').map(e => e.trim());

  const phoneVal = settings?.contactPhone || '+91 98765 43210';
  const phones = phoneVal.split(',').map(p => p.trim());

  const addressVal = settings?.contactAddress || 'MELORAA Fashion Pvt. Ltd.\nMumbai, Maharashtra, India';
  const addressLines = addressVal.split('\n');

  const mapUrl = getEmbedUrl(settings?.contactMapUrl);

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh' }}>
      <Header />
      <section 
        className="page-hero contact-hero" 
        style={{ 
          backgroundImage: `linear-gradient(rgba(58, 8, 9, 0.78), rgba(79, 12, 16, 0.78)), url('/images/contact-hero-bg.png')` 
        }}
      >
        <h1>Contact Us</h1>
        <p>We'd love to hear from you</p>
        <div className="breadcrumb"><Link to="/">Home</Link> / Contact</div>
      </section>

      <div className="contact-page-container">
        <div className="contact-grid-premium">
          {/* Form Card */}
          <div className="contact-form-card">
            <h2>Send us a Message</h2>
            <p>Fill out the form and our team will respond within 24 hours.</p>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Your Name</label>
                  <input 
                    type="text" 
                    placeholder="John Doe" 
                    value={form.name} 
                    onChange={e => setForm({ ...form, name: e.target.value })} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    placeholder="john@example.com" 
                    value={form.email} 
                    onChange={e => setForm({ ...form, email: e.target.value })} 
                    required 
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Subject</label>
                <select 
                  value={form.subject} 
                  onChange={e => setForm({ ...form, subject: e.target.value })} 
                  required
                >
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
                <textarea 
                  placeholder="Tell us how we can help..." 
                  value={form.message} 
                  onChange={e => setForm({ ...form, message: e.target.value })} 
                  required 
                />
              </div>
              <button type="submit" className="btn-submit" disabled={sending}>
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>

          {/* Info Sidebar */}
          <div className="contact-info-sidebar">
            <div className="contact-card-premium">
              <div className="contact-card-icon">📧</div>
              <h3>Email</h3>
              {emails.map((email, idx) => (
                <p key={idx}>{email}</p>
              ))}
            </div>
            
            <div className="contact-card-premium">
              <div className="contact-card-icon">📞</div>
              <h3>Phone</h3>
              {phones.map((phone, idx) => (
                <p key={idx}>{phone}</p>
              ))}
            </div>
            
            <div className="contact-card-premium">
              <div className="contact-card-icon">📍</div>
              <h3>Office Address</h3>
              {addressLines.map((line, idx) => (
                <p key={idx}><strong>{idx === 0 ? line : ''}</strong>{idx > 0 ? line : ''}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Map Section */}
        {mapUrl && (
          <div className="contact-map-section">
            <iframe
              title="Google Maps Location"
              src={mapUrl}
              className="contact-map-iframe"
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
