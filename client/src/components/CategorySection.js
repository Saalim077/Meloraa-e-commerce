import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/categorySection.css';

const categories = [
  { id: 1, name: 'TOPWEAR', image: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&q=80&w=600', path: '/shop' },
  { id: 2, name: 'BAGS & ACCESSORIES', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600', path: '/shop' },
  { id: 3, name: 'DRESSES', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=600', path: '/shop' },
  { id: 4, name: 'BOTTOMWEAR', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=600', path: '/shop' },
];

export default function CategorySection() {
  const navigate = useNavigate();

  return (
    <section className="category-section">
      <div className="category-header">
        <h2 className="section-title-maroon">SHOP BY CATEGORY</h2>
      </div>
      <div className="category-grid">
        {categories.map(cat => (
          <div key={cat.id} className="category-card" onClick={() => navigate(cat.path)}>
            <div className="category-image-wrap">
               <img src={cat.image} alt={cat.name} className="category-img" />
            </div>
            <div className="category-overlay">
              <span className="category-name">{cat.name}</span>
              <span className="category-shop-now">SHOP NOW</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
