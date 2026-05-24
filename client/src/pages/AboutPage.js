import React from 'react';
import { FiFacebook, FiYoutube, FiInstagram } from 'react-icons/fi';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/pages.css';

export default function AboutPage() {
  return (
    <div style={{ background: '#ffffff', minHeight: '100vh' }}>
      <Header />
      
      <div className="about-us-container">
        <h1 className="about-title">ABOUT US</h1>
        
        <img src="/images/logo.png" alt="Meloraa Logo" className="about-brand-logo" />

        <div className="about-content-body">
          <p className="about-intro-text">
            Meloraa is a homegrown label started in India, inspired by today's multi-dimensional woman. The one who leads, laughs, dreams, and conquers on her own terms. We redefine power dressing for the modern woman. Meloraa clothing is not just fabric, it's a presence, it's a posture, it's power.
          </p>
          
          <p className="about-intro-text">
            At Meloraa, we create soft-sexy, warm and tailored silhouettes that transform the way a woman walks into a room. From boardrooms to brunches, deadlines to date nights, our pieces are designed to transition anytime, anywhere. We design clothing that doesn't just fit your body, it fits your mindset.
          </p>

          <blockquote className="about-quote-block">
            <span className="about-quote-icon">“</span>
            <p className="about-quote-text">
              Meloraa is more than fashion. It's a reminder — you belong, you lead, and you own your space.
            </p>
          </blockquote>

          <div className="about-social-links">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><FiFacebook /></a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><FiYoutube /></a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><FiInstagram /></a>
          </div>

          <div className="about-section-divider"></div>

          <section className="about-philosophy-section">
            <h2 className="about-philosophy-title">The Philosophy</h2>
            <p className="about-philosophy-text">
              Our philosophy is rooted in precision tailoring and structural silhouettes that enhance posture, confidence, and authority. We prioritize quality over quantity, creating timeless pieces that transcend fleeting trends and retain their strength season after season. Through a modern interpretation of power dressing, we celebrate a woman who is intelligent, ambitious, and unapologetically strong. Meloraa is intentional design for women who are building careers, companies, and legacies—and who understand that presence is power.
            </p>
          </section>

          <div className="about-section-divider"></div>

          <section className="about-testimonials-section">
            <h2 className="about-testimonials-title">Testimonials</h2>
            
            <div className="about-testimonials-list">
              <div className="about-testimonial-item">
                <p className="about-testimonial-quote">
                  "Wearing Meloraa completely changed how I walk into meetings. The structure, the tailoring, the way it sits on the shoulders — it instantly elevates my presence. I feel composed, powerful, and taken seriously the moment I step in."
                </p>
                <div className="about-testimonial-author-box">
                  <div className="about-testimonial-author-avatar-fallback">PR</div>
                  <div className="about-testimonial-author-meta">
                    <div className="about-testimonial-author-name">Paula Robinson</div>
                    <div className="about-testimonial-author-role">Fashion Designer & Reviewer</div>
                  </div>
                </div>
              </div>

              <div className="about-testimonial-item">
                <p className="about-testimonial-quote">
                  "I've never experienced clothing that impacts my confidence this way. Meloraa isn't just fashion—it's a mindset. It makes me stand a bit taller, speak clearer, and own my space unapologetically."
                </p>
                <div className="about-testimonial-author-box">
                  <div className="about-testimonial-author-avatar-fallback">LC</div>
                  <div className="about-testimonial-author-meta">
                    <div className="about-testimonial-author-name">Luis Carlos</div>
                    <div className="about-testimonial-author-role">Fashion Designer & Reviewer</div>
                  </div>
                </div>
              </div>

              <div className="about-testimonial-item">
                <p className="about-testimonial-quote">
                  "MELORAA clothing is structural yet fluid. It's timeless, well-constructed, and designed with intention."
                </p>
                <div className="about-testimonial-author-box">
                  <div className="about-testimonial-author-avatar-fallback">ES</div>
                  <div className="about-testimonial-author-meta">
                    <div className="about-testimonial-author-name">Elicia Stone</div>
                    <div className="about-testimonial-author-role">Fashion Designer & Reviewer</div>
                  </div>
                </div>
              </div>

              <div className="about-testimonial-item">
                <p className="about-testimonial-quote">
                  "Meloraa understands power dressing in a way that feels contemporary and feminine. It's structured without being stiff, bold without being loud. It's the kind of clothing that speaks before you do."
                </p>
                <div className="about-testimonial-author-box">
                  <div className="about-testimonial-author-avatar-fallback">MC</div>
                  <div className="about-testimonial-author-meta">
                    <div className="about-testimonial-author-name">Matthew Commons</div>
                    <div className="about-testimonial-author-role">Fashion Designer & Reviewer</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}
