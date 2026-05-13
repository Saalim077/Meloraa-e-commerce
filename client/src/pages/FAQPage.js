import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/pages.css';

const FAQ_DATA = [
  {
    category: 'Orders & Shipping',
    items: [
      { q: 'How do I place an order?', a: 'Browse our collection, add items to your cart, and proceed to checkout. You can pay using credit/debit card, UPI, net banking, or cash on delivery.' },
      { q: 'How long does delivery take?', a: 'Standard delivery takes 3-5 business days for metro cities and 5-7 business days for other locations. Express delivery (1-2 days) is available in select cities.' },
      { q: 'Is shipping free?', a: 'Yes! We offer free shipping on all orders above ₹999. For orders below ₹999, a flat ₹49 shipping fee applies.' },
      { q: 'How can I track my order?', a: 'Visit our Track Order page and enter your Order ID. You\'ll also receive tracking updates via email and SMS.' },
      { q: 'Do you ship internationally?', a: 'Currently, we ship only within India. International shipping will be available soon. Stay tuned!' },
    ]
  },
  {
    category: 'Payments',
    items: [
      { q: 'What payment methods do you accept?', a: 'We accept Visa, Mastercard, RuPay, UPI (Google Pay, PhonePe, Paytm), net banking, and Cash on Delivery (COD).' },
      { q: 'Is my payment information secure?', a: 'Absolutely. All transactions are processed through industry-standard SSL encryption. We never store your card details on our servers.' },
      { q: 'Can I pay with Cash on Delivery?', a: 'Yes, COD is available on orders up to ₹5,000 for most pin codes across India.' },
      { q: 'When will I be charged for my order?', a: 'For online payments, you\'ll be charged at the time of placing the order. For COD, payment is collected upon delivery.' },
    ]
  },
  {
    category: 'Returns & Refunds',
    items: [
      { q: 'What is your return policy?', a: 'We offer a 7-day easy return policy. If you\'re not satisfied with your purchase, you can initiate a return within 7 days of delivery.' },
      { q: 'How do I return an item?', a: 'Go to your Profile → Orders → select the order and click "Request Return." Our team will arrange a pickup from your address.' },
      { q: 'How long do refunds take?', a: 'Refunds are processed within 5-7 business days after we receive and inspect the returned item. The amount will be credited to your original payment method.' },
      { q: 'Can I exchange an item?', a: 'Yes, you can exchange for a different size or color of the same product. Exchanges are processed within 3-5 business days.' },
    ]
  },
  {
    category: 'Account & General',
    items: [
      { q: 'Do I need an account to shop?', a: 'No, you can checkout as a guest. However, creating an account lets you track orders, save addresses, and enjoy exclusive member benefits.' },
      { q: 'How do I reset my password?', a: 'Click "Forgot Password" on the login page. We\'ll send a password reset link to your registered email address.' },
      { q: 'How can I contact customer support?', a: 'You can reach us via email at support@meloraa.com, call us at +91 98765 43210, or use the Contact Us page on our website.' },
    ]
  }
];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState({});
  const [search, setSearch] = useState('');

  const toggle = (catIdx, itemIdx) => {
    const key = `${catIdx}-${itemIdx}`;
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filtered = FAQ_DATA.map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      !search || item.q.toLowerCase().includes(search.toLowerCase()) || item.a.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  return (
    <div style={{ background: '#faf8f6', minHeight: '100vh' }}>
      <Header />
      <section className="page-hero">
        <h1>Help Center</h1>
        <p>Find answers to your questions</p>
        <div className="breadcrumb"><Link to="/">Home</Link> / FAQ</div>
      </section>

      <div className="page-container">
        {/* Search */}
        <div style={{ maxWidth: '500px', margin: '0 auto 50px' }}>
          <input type="text" placeholder="Search for answers..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '16px 22px', border: '1px solid #e5e2df', borderRadius: '10px', fontSize: '1rem', fontFamily: 'var(--font-body)', background: 'white', boxSizing: 'border-box' }} />
        </div>

        {/* FAQ Sections */}
        {filtered.map((cat, catIdx) => (
          <div key={catIdx} className="faq-category">
            <h3>{cat.category}</h3>
            {cat.items.map((item, itemIdx) => {
              const key = `${catIdx}-${itemIdx}`;
              const isOpen = openItems[key];
              return (
                <div className="accordion" key={itemIdx}>
                  <button className={`accordion-header ${isOpen ? 'active' : ''}`} onClick={() => toggle(catIdx, itemIdx)}>
                    <span>{item.q}</span>
                    <span className="accordion-icon">+</span>
                  </button>
                  {isOpen && <div className="accordion-body">{item.a}</div>}
                </div>
              );
            })}
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#8a8a8a' }}>
            <p>No results found for "{search}"</p>
          </div>
        )}

        {/* Still need help */}
        <div className="cta-banner">
          <h2>Still Have Questions?</h2>
          <p>Our support team is always happy to help</p>
          <Link to="/contact" className="btn-cta">Contact Us</Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
