import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToCart, openCart } from '../store';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/pages.css';

export default function HomePage() {
  const dispatch = useDispatch();
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        axios.get('/api/products?limit=8&sort=-createdAt'),
        axios.get('/api/categories')
      ]);
      setFeatured(prodRes.data.products || []);
      setCategories((catRes.data.categories || []).filter(c => !c.parent).slice(0, 4));
    } catch (err) { console.error('Homepage data error:', err.message); }
  };

  const getImg = (p) => p.images?.[0] || p.image || 'https://placehold.co/400x500?text=MELORAA';

  const catImages = [
    'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=600&h=800&fit=crop',
  ];

  return (
    <div className="home-container">
      <Header />

      {/* ─── Hero Section ───────────────────────────────────────────── */}
      <section className="home-hero-premium" style={{ backgroundImage: 'url(/images/hero-banner.png)' }}>
        <div className="hero-overlay-subtle" />
        <div className="container">
          <div className="hero-content-premium fade-up">
            <h1 className="hero-title-premium">EMBRACE<br/>THE ELEGANCE.</h1>
            <p className="hero-subtitle-premium">NEW COLLECTION '24</p>
            <Link to="/shop" className="btn btn-maroon hero-cta">DISCOVER NOW</Link>
          </div>
        </div>
      </section>

      {/* ─── Shop By Category ───────────────────────────────────────── */}
      <section className="section categories-section">
        <div className="container">
          <h2 className="section-title-centered">SHOP BY CATEGORY</h2>
          <div className="categories-grid-premium">
            {[
              { id: 'topwear', name: 'TOPWEAR', desc: 'Stylish woman in linen', img: '/images/cat-topwear.png' },
              { id: 'bags', name: 'BAGS', desc: 'Luxury maroon leather tote', img: '/images/cat-bags.png' },
              { id: 'dresses', name: 'DRESSES', desc: 'Model in vibrant gown', img: '/images/cat-dresses.png' },
              { id: 'bottomwear', name: 'BOTTOMWEAR', desc: 'Elegant woman in tailored', img: '/images/cat-bottomwear.png' }
            ].map(cat => (
              <Link to={`/shop?category=${cat.id}`} className="cat-card-premium" key={cat.id}>
                <div className="cat-img-wrapper">
                  <img src={cat.img} alt={cat.name} />
                  <div className="cat-overlay-premium">
                    <div className="cat-text-box">
                      <h3>{cat.name}</h3>
                      <p>{cat.desc}</p>
                      <span className="cat-link-premium">SHOP NOW</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured Products ───────────────────────────────────────── */}
      <section className="section featured-products-section">
        <div className="container">
          <h2 className="section-title-centered">FEATURED PRODUCTS</h2>
          <div className="featured-grid-premium">
            {[
              { _id: '1', name: 'Amara Silk Blouse', category: { name: 'Maroon' }, price: 18500, img: '/images/product-1.png' },
              { _id: '2', name: 'Leather Tote Bag', category: { name: 'Accessories' }, price: 24500, img: '/images/product-2.png' },
              { _id: '3', name: 'Evening Flow Gown', category: { name: 'Dresses' }, price: 32000, img: '/images/product-3.png' },
              { _id: '4', name: 'Wool Tailored Trousers', category: { name: 'Bottomwear' }, price: 15500, img: '/images/product-4.png' }
            ].map(product => (
              <div key={product._id} className="product-card-premium fade-up">
                <div className="product-img-wrapper">
                  <Link to={`/product/${product._id}`}>
                    <img src={product.img} alt={product.name} />
                  </Link>
                  <button 
                    onClick={() => { dispatch(addToCart({ ...product, productId: product._id })); dispatch(openCart()); }}
                    className="btn-add-cart"
                  >
                    ADD TO CART
                  </button>
                </div>
                <div className="product-info-premium">
                  <h4 className="product-name-premium">{product.name}</h4>
                  <p className="product-cat-premium">{product.category.name}</p>
                  <p className="product-price-premium">₹{product.price.toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="featured-grid-premium" style={{ marginTop: '60px' }}>
            {featured.slice(0, 4).map(product => (
              <div key={product._id} className="product-card-premium fade-up">
                <div className="product-img-wrapper">
                  <Link to={`/product/${product._id}`}>
                    <img src={getImg(product)} alt={product.name} />
                  </Link>
                  <button 
                    onClick={() => { dispatch(addToCart({ ...product, productId: product._id })); dispatch(openCart()); }}
                    className="btn-add-cart"
                  >
                    ADD TO CART
                  </button>
                </div>
                <div className="product-info-premium">
                  <h4 className="product-name-premium">{product.name}</h4>
                  <p className="product-cat-premium">{product.category?.name || 'Maroon'}</p>
                  <p className="product-price-premium">₹{product.price?.toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features Banner ────────────────────────────────────────── */}
      <section className="section-padding container">
        <div className="features-banner-premium">
          <div className="feature-item-premium">
            <div className="feature-icon-premium">✈</div>
            <h4>FREE SHIPPING</h4>
            <p>On all orders above ₹50,000</p>
          </div>
          <div className="feature-item-premium">
            <div className="feature-icon-premium">↺</div>
            <h4>EASY RETURNS</h4>
            <p>30-day hassle-free return policy</p>
          </div>
          <div className="feature-item-premium">
            <div className="feature-icon-premium">🔒</div>
            <h4>SECURE PAYMENT</h4>
            <p>100% secure payment gateway</p>
          </div>
        </div>
      </section>

      {/* ─── Brand Story Banner (Optional, keeping clean) ────────────── */}
      <Footer />
    </div>
  );
}
