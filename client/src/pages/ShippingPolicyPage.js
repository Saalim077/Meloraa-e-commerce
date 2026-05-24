import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { settingsAPI } from '../utils/api';
import '../styles/pages.css';

export default function ShippingPolicyPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeAccordion, setActiveAccordion] = useState('shipping'); // 'shipping', 'returns', 'eligibility'

  useEffect(() => {
    settingsAPI.getSettings()
      .then(res => setSettings(res.data))
      .catch(err => console.error('Failed to load settings in policy page:', err))
      .finally(() => setLoading(false));
  }, []);

  const toggleAccordion = (section) => {
    setActiveAccordion(activeAccordion === section ? '' : section);
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

  const phoneVal = settings?.contactPhone || '+91 97799720364';
  const emailVal = settings?.contactEmail || 'help@shopmeloraa.com';

  return (
    <div style={{ background: '#faf8f6', minHeight: '100vh' }}>
      <Header />
      <section className="page-hero" style={{ background: 'linear-gradient(135deg, var(--maroon) 0%, #3a0809 100%)' }}>
        <h1 style={{ color: '#ffffff' }}>Returns & Refunds</h1>
        <p>Shop with Confidence</p>
        <div className="breadcrumb"><Link to="/">Home</Link> / Returns & Refunds</div>
      </section>

      <div className="page-container policy-content" style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 24px' }}>
        
        {/* Intro Section */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <p style={{ fontSize: '1.05rem', lineHeight: '1.8', color: '#555', maxWidth: '800px', margin: '0 auto' }}>
            At Meloraa, your satisfaction is our priority. We are committed to providing you with the highest quality products and a seamless shopping experience. If you are not completely satisfied with your purchase, we offer a simple and convenient return and exchange process. Please review our return and exchange policy below for full details and instructions.
          </p>
        </div>

        {/* 3-Column Highlights Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '60px' }} className="policy-highlights-grid">
          
          {/* Column 1: Eligibility */}
          <div style={{ background: 'white', border: '1px solid #f0ebe4', borderRadius: '12px', padding: '30px 20px', textAlign: 'center', boxShadow: '0 4px 15px rgba(79, 12, 16, 0.01)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '16px', color: 'var(--maroon)' }}>🛍️</div>
            <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--maroon)', fontSize: '1.25rem', marginBottom: '16px', fontWeight: '600' }}>Eligibility</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#666', lineHeight: '1.8', fontSize: '0.9rem' }}>
              <li style={{ borderBottom: '1px dashed #f0ebe4', paddingBottom: '6px', marginBottom: '6px' }}>7-Day Window</li>
              <li style={{ borderBottom: '1px dashed #f0ebe4', paddingBottom: '6px', marginBottom: '6px' }}>Original Tags Attached</li>
              <li>Unworn & Unwashed</li>
            </ul>
          </div>

          {/* Column 2: Easy Process */}
          <div style={{ background: 'white', border: '1px solid #f0ebe4', borderRadius: '12px', padding: '30px 20px', textAlign: 'center', boxShadow: '0 4px 15px rgba(79, 12, 16, 0.01)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '16px', color: 'var(--maroon)' }}>🚚</div>
            <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--maroon)', fontSize: '1.25rem', marginBottom: '16px', fontWeight: '600' }}>Easy Process</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#666', lineHeight: '1.8', fontSize: '0.9rem' }}>
              <li style={{ borderBottom: '1px dashed #f0ebe4', paddingBottom: '6px', marginBottom: '6px' }}>Online Portal</li>
              <li style={{ borderBottom: '1px dashed #f0ebe4', paddingBottom: '6px', marginBottom: '6px' }}>Prepaid Label</li>
              <li>Quick Dispatch</li>
            </ul>
          </div>

          {/* Column 3: Refunds */}
          <div style={{ background: 'white', border: '1px solid #f0ebe4', borderRadius: '12px', padding: '30px 20px', textAlign: 'center', boxShadow: '0 4px 15px rgba(79, 12, 16, 0.01)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '16px', color: 'var(--maroon)' }}>🪙</div>
            <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--maroon)', fontSize: '1.25rem', marginBottom: '16px', fontWeight: '600' }}>Refunds</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#666', lineHeight: '1.8', fontSize: '0.9rem' }}>
              <li style={{ borderBottom: '1px dashed #f0ebe4', paddingBottom: '6px', marginBottom: '6px' }}>Refund</li>
              <li style={{ borderBottom: '1px dashed #f0ebe4', paddingBottom: '6px', marginBottom: '6px' }}>7-10 Biz Days</li>
              <li>Final Sale Exclusions</li>
            </ul>
          </div>

        </div>

        {/* Section Heading: SHIPPING & RETURNS */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--maroon)', fontWeight: '500', letterSpacing: '0.05em' }}>SHIPPING & RETURNS</h2>
        </div>

        {/* Accordions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
          
          {/* Accordion 1: SHIPPING & DELIVERY */}
          <div style={{ background: 'white', border: '1px solid #f0ebe4', borderRadius: '8px', overflow: 'hidden' }}>
            <div 
              onClick={() => toggleAccordion('shipping')} 
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', cursor: 'pointer', background: activeAccordion === 'shipping' ? '#fcfaf7' : '#ffffff', transition: 'background 0.2s ease' }}
            >
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--maroon)', fontWeight: '600', letterSpacing: '0.05em', fontFamily: 'var(--font-display)' }}>SHIPPING & DELIVERY</h3>
              <span style={{ fontSize: '1.5rem', fontWeight: '300', color: 'var(--maroon)' }}>{activeAccordion === 'shipping' ? '−' : '+'}</span>
            </div>
            {activeAccordion === 'shipping' && (
              <div style={{ padding: '24px 30px', borderTop: '1px solid #f0ebe4', lineHeight: '1.8', color: '#555' }}>
                <p style={{ fontStyle: 'italic', marginBottom: '20px', color: '#333' }}>
                  At <strong>MELORAA</strong>, we ensure your western wardrobe essentials reach you safely and on time.
                </p>
                
                <h4 style={{ color: '#1a1a1a', fontWeight: '600', marginTop: '16px', marginBottom: '8px' }}>Order Dispatch</h4>
                <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
                  <li>Orders placed before <strong>9:00 AM</strong> are dispatched the same working day.</li>
                  <li>Orders placed after 9:00 AM, or on weekends and public holidays, are dispatched on the next working day.</li>
                </ul>

                <h4 style={{ color: '#1a1a1a', fontWeight: '600', marginTop: '16px', marginBottom: '8px' }}>Estimated Delivery Time</h4>
                <ul style={{ paddingLeft: '20px', marginBottom: '8px' }}>
                  <li>Metro Cities: <strong>3–5 working days</strong></li>
                  <li>Other Locations: <strong>4–7 working days</strong></li>
                </ul>
                <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '16px' }}>Delivery timelines may vary slightly depending on your location and courier service.</p>

                <h4 style={{ color: '#1a1a1a', fontWeight: '600', marginTop: '16px', marginBottom: '8px' }}>Order Tracking</h4>
                <p style={{ marginBottom: '16px' }}>Once your order is shipped, you will receive a tracking link via email or SMS so you can monitor your delivery in real time.</p>

                <h4 style={{ color: '#1a1a1a', fontWeight: '600', marginTop: '16px', marginBottom: '8px' }}>Taxes & Charges</h4>
                <p style={{ marginBottom: '16px' }}>All product prices are <strong>inclusive of applicable taxes</strong>. No hidden charges will be added at checkout.</p>

                <h4 style={{ color: '#1a1a1a', fontWeight: '600', marginTop: '16px', marginBottom: '8px' }}>Cash on Delivery (COD)</h4>
                <ul style={{ paddingLeft: '20px', margin: 0 }}>
                  <li>COD is available for orders up to <strong>₹5,000</strong>.</li>
                  <li>Orders above ₹5,000 must be prepaid.</li>
                </ul>
              </div>
            )}
          </div>

          {/* Accordion 2: RETURNS & EXCHANGES */}
          <div style={{ background: 'white', border: '1px solid #f0ebe4', borderRadius: '8px', overflow: 'hidden' }}>
            <div 
              onClick={() => toggleAccordion('returns')} 
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', cursor: 'pointer', background: activeAccordion === 'returns' ? '#fcfaf7' : '#ffffff', transition: 'background 0.2s ease' }}
            >
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--maroon)', fontWeight: '600', letterSpacing: '0.05em', fontFamily: 'var(--font-display)' }}>RETURNS & EXCHANGES</h3>
              <span style={{ fontSize: '1.5rem', fontWeight: '300', color: 'var(--maroon)' }}>{activeAccordion === 'returns' ? '−' : '+'}</span>
            </div>
            {activeAccordion === 'returns' && (
              <div style={{ padding: '24px 30px', borderTop: '1px solid #f0ebe4', lineHeight: '1.8', color: '#555' }}>
                <p>We provide a seamless online process for your returns and exchanges:</p>
                <h4 style={{ color: '#1a1a1a', fontWeight: '600', marginTop: '16px', marginBottom: '8px' }}>How to Initiate</h4>
                <p>Log in to your Meloraa Account, navigate to your orders section under your profile, select your items, and choose return or exchange.</p>
                
                <h4 style={{ color: '#1a1a1a', fontWeight: '600', marginTop: '16px', marginBottom: '8px' }}>Prepaid Shipping Label</h4>
                <p>Once requested, we generate a prepaid label. A reverse pickup will be scheduled at no extra charge to you.</p>

                <h4 style={{ color: '#1a1a1a', fontWeight: '600', marginTop: '16px', marginBottom: '8px' }}>Quick Dispatch for Exchanges</h4>
                <p>For size or item exchanges, the new shipment is dispatched immediately once the return shipment is collected and scanned by our delivery partner.</p>
              </div>
            )}
          </div>

          {/* Accordion 3: ELIGIBILITY & EXCLUSIONS */}
          <div style={{ background: 'white', border: '1px solid #f0ebe4', borderRadius: '8px', overflow: 'hidden' }}>
            <div 
              onClick={() => toggleAccordion('eligibility')} 
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', cursor: 'pointer', background: activeAccordion === 'eligibility' ? '#fcfaf7' : '#ffffff', transition: 'background 0.2s ease' }}
            >
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--maroon)', fontWeight: '600', letterSpacing: '0.05em', fontFamily: 'var(--font-display)' }}>ELIGIBILITY & EXCLUSIONS</h3>
              <span style={{ fontSize: '1.5rem', fontWeight: '300', color: 'var(--maroon)' }}>{activeAccordion === 'eligibility' ? '−' : '+'}</span>
            </div>
            {activeAccordion === 'eligibility' && (
              <div style={{ padding: '24px 30px', borderTop: '1px solid #f0ebe4', lineHeight: '1.8', color: '#555' }}>
                <h4 style={{ color: '#1a1a1a', fontWeight: '600', marginBottom: '8px' }}>Eligibility Guidelines</h4>
                <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
                  <li>Returns must be requested within the <strong>7-day window</strong> from delivery.</li>
                  <li>Items must be unworn, unwashed, and without scent.</li>
                  <li>All original product tags and packaging must remain completely intact.</li>
                </ul>

                <h4 style={{ color: '#1a1a1a', fontWeight: '600', marginTop: '16px', marginBottom: '8px' }}>Exclusions & Final Sale</h4>
                <p>Certain items (like accessories, personal wear, or custom-tailored goods) and items explicitly marked as "Final Sale" are excluded from return or refund eligibility.</p>
              </div>
            )}
          </div>

        </div>

        {/* Contact Info card */}
        <div style={{ background: '#fcfaf7', border: '1px solid #f0ebe4', padding: '30px', borderRadius: '12px', textAlign: 'center', marginTop: '20px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--maroon)', fontSize: '1.25rem', marginBottom: '12px', fontWeight: '600' }}>Need Help?</h3>
          <p style={{ color: '#555', marginBottom: '16px' }}>If you have any questions regarding your delivery, returns, or refunds, please reach out to us:</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap', fontSize: '0.95rem' }}>
            <span style={{ color: '#333' }}>📞 <strong>Phone:</strong> {phoneVal}</span>
            <span style={{ color: '#333' }}>📧 <strong>Email:</strong> <a href={`mailto:${emailVal}`} style={{ color: 'var(--maroon)', textDecoration: 'none' }}>{emailVal}</a></span>
          </div>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '0.8rem', color: '#999' }}>
          <p><strong>Registered Office:</strong> Okhla Industrial Area Phase III, New Delhi, India.</p>
        </div>

      </div>

      <Footer />
    </div>
  );
}
