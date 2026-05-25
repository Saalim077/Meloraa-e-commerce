import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { toggleWishlistItem, addToCart, openCart } from '../store';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/product-detail.css';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const wishlistItems = useSelector(s => s.wishlist.items);
  
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedAttrs, setSelectedAttrs] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [sizeUnit, setSizeUnit] = useState('in'); // 'in' or 'cm'
  const [settings, setSettings] = useState(null);

  // Review states
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ average: 0, total: 0 });
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });

  // Zoom magnifier states
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);

  useEffect(() => {
    fetchProduct();
    fetchSettings();
    fetchReviews();
  }, [id]);

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/reviews/product/${id}`);
      const list = res.data.reviews || [];
      setReviews(list);
      const total = res.data.pagination?.total || list.length || 0;
      const avg = list.length > 0 ? (list.reduce((sum, r) => sum + r.rating, 0) / list.length) : 0;
      setReviewStats({ average: total > 0 ? avg.toFixed(1) : 0, total });
    } catch (e) {
      console.error('Failed to fetch reviews', e);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to submit a review');
      return;
    }
    if (!reviewForm.title.trim()) {
      toast.error('Review title is required');
      return;
    }
    try {
      await api.post('/reviews', {
        productId: id,
        rating: reviewForm.rating,
        title: reviewForm.title,
        comment: reviewForm.comment
      });
      toast.success('Review submitted for approval!');
      setReviewForm({ rating: 5, title: '', comment: '' });
      fetchReviews();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      setSettings(res.data);
    } catch (e) { console.error('Settings fetch error', e); }
  };

  const handleMouseEnter = () => {
    setIsZooming(true);
  };

  const handleMouseLeave = () => {
    setIsZooming(false);
  };

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    const px = (x / width) * 100;
    const py = (y / height) * 100;
    setZoomPos({ x, y, px, py });
  };

  const renderStars = (rating) => {
    const num = Math.round(rating);
    return '★'.repeat(num) + '☆'.repeat(5 - num);
  };


  useEffect(() => {
    if (product && product.hasVariants && product.variants?.length > 0) {
      const variationAttributes = product.attributes?.filter(a => a.isVariation) || [];
      const isAllSelected = variationAttributes.every(a => selectedAttrs[a.name]);

      if (isAllSelected) {
        const matches = product.variants.filter(v => {
          const vAttrs = v.name?.split(' - ') || [];
          return variationAttributes.every((a, idx) => {
            const selectedVal = selectedAttrs[a.name];
            const variantVal = vAttrs[idx];
            return variantVal === selectedVal || !variantVal;
          });
        });

        if (matches.length > 0) {
          const bestMatch = matches.sort((a, b) => {
            const aExact = a.name.split(' - ').filter(val => val).length;
            const bExact = b.name.split(' - ').filter(val => val).length;
            return bExact - aExact;
          })[0];
          setSelectedVariant(bestMatch);
          if (bestMatch.images?.length > 0) {
            setActiveImage(bestMatch.images[0]);
          }
        } else {
          setSelectedVariant(null);
        }
      } else {
        setSelectedVariant(null);
      }
    }
  }, [selectedAttrs, product]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/products/${id}`);
      const productData = response.data.product || response.data.data || response.data;
      setProduct(productData);
      setActiveImage(productData.mainImage || productData.images?.[0] || '');
      if (productData.defaultVariant) {
        setSelectedAttrs(productData.defaultVariant);
      }
    } catch (error) {
      console.error('Product fetch error:', error);
      toast.error('Product not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleAttrChange = (name, value) => {
    const newAttrs = { ...selectedAttrs, [name]: value };
    setSelectedAttrs(newAttrs);
    setQuantity(1);

    if (name.toLowerCase() === 'color' && product.variants?.length > 0) {
      const colorAttrIdx = product.attributes?.findIndex(a => a.name.toLowerCase() === 'color');
      const firstColorMatch = product.variants.find(v => {
        const vAttrs = v.name?.split(' - ') || [];
        return vAttrs[colorAttrIdx] === value && v.images?.length > 0;
      });
      if (firstColorMatch) {
        setActiveImage(firstColorMatch.images[0]);
      }
    }
  };

  const handleAddToCart = (type = 'cart') => {
    if (product.hasVariants && product.attributes?.filter(a => a.isVariation).length > 0 && !selectedVariant) {
      toast.error('Please select your size and options');
      return;
    }

    const priceToUse = selectedVariant ? selectedVariant.price : product.price;
    const currentStock = selectedVariant ? selectedVariant.stock : product.stock;

    if (quantity > currentStock) {
      toast.error(`Only ${currentStock} items available in stock.`);
      return;
    }

    dispatch(addToCart({
      _id: selectedVariant?._id || product._id,
      productId: product._id,
      name: product.name,
      price: priceToUse,
      image: (selectedVariant?.images && selectedVariant.images[0]) || activeImage || product.mainImage,
      quantity: quantity,
      variant: selectedVariant?.name,
      slug: product.slug || id,
      stock: currentStock,
      taxClass: product.taxClass || ''
    }));

    if (type === 'cart') {
      toast.success('Added to cart!');
      dispatch(openCart());
    } else {
      navigate('/checkout');
    }
  };

  const getInclusivePrice = (priceVal) => {
    let price = priceVal || 0;
    if (!settings || !settings.taxEnabled || settings.taxInclusive) return price;

    let rate = settings.taxRate || 0;
    if (product?.taxClass && settings.taxClasses) {
      const tc = settings.taxClasses.find(c => c.name === product.taxClass);
      if (tc) rate = tc.rate;
    }

    return Math.round(price * (1 + rate / 100));
  };

  if (loading) return <div className="loading-center"><div className="spinner spinner-lg" /></div>;
  if (!product) return <div className="product-detail"><p>Product not found</p></div>;

  const handleWishlist = () => {
    if (!user) { toast.error('Please login to save items'); return; }
    dispatch(toggleWishlistItem({ _id: product._id, name: product.name, images: product.images }));
  };
  const isInWishlist = wishlistItems.some(i => i._id === product._id);
  const displayPrice = getInclusivePrice(selectedVariant ? selectedVariant.price : product.price);
  const displayComparePrice = getInclusivePrice(selectedVariant ? selectedVariant.comparePrice : (product.comparePrice || 0));
  const displayStock = selectedVariant ? selectedVariant.stock : product.stock;
  const displaySku = selectedVariant ? selectedVariant.sku || product.sku : product.sku;

  // Determine gallery images
  let galleryImages = [];
  const selectedColor = selectedAttrs.Color || selectedAttrs.color;
  if (selectedColor) {
    const matchingVariants = product.variants?.filter(v => {
      const vAttrs = v.name?.split(' - ') || [];
      const colorAttrIdx = product.attributes?.findIndex(a => a.name.toLowerCase() === 'color');
      return vAttrs[colorAttrIdx] === selectedColor;
    }) || [];
    galleryImages = [...new Set(matchingVariants.flatMap(v => v.images || []))];
  } else {
    galleryImages = [
      ...(product.mainImage ? [product.mainImage] : []),
      ...(product.images || [])
    ];
  }

  return (
    <>
      <Header />
      <div className="product-detail">
        {/* Breadcrumbs */}
        <div className="breadcrumb">
          <Link to="/">Home</Link> <span>/</span> 
          <Link to="/shop">Clothing</Link> <span>/</span> 
          <Link to="/shop">{product.category?.name || 'Category'}</Link> <span>/</span>
          <span className="current">{product.name}</span>
        </div>

        <div className="detail-container">
          {/* Vertical Gallery */}
          <div className="vertical-gallery">
            {galleryImages.map((img, idx) => (
              <div 
                key={idx} 
                className={`v-thumb ${activeImage === img ? 'active' : ''}`}
                onClick={() => setActiveImage(img)}
              >
                <img src={img} alt="" />
              </div>
            ))}
          </div>

          {/* Main Image Stage with Hover Magnifier */}
          <div 
            className="main-stage"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
            style={{ position: 'relative', overflow: 'hidden', cursor: 'zoom-in' }}
          >
            <img src={activeImage} alt={product.name} />
            {isZooming && (
              <div 
                className="zoom-lens"
                style={{
                  position: 'absolute',
                  left: `${zoomPos.x}px`,
                  top: `${zoomPos.y}px`,
                  transform: 'translate(-50%, -50%)',
                  width: '180px',
                  height: '180px',
                  borderRadius: '50%',
                  border: '2px solid var(--gold)',
                  boxShadow: '0 5px 15px rgba(0,0,0,0.3), inset 0 0 10px rgba(0,0,0,0.2)',
                  backgroundImage: `url(${activeImage})`,
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '300% 300%',
                  backgroundPosition: `${zoomPos.px}% ${zoomPos.py}%`,
                  pointerEvents: 'none',
                  zIndex: 10
                }}
              />
            )}
          </div>

          {/* Sticky Sidebar Info */}
          <div className="sticky-sidebar">
            <div className="product-header">
              <h1>{product.name}</h1>
              {reviewStats.total > 0 && (
                <div 
                  className="rating-summary-header" 
                  onClick={() => {
                    setActiveTab('reviews');
                    const element = document.querySelector('.product-tabs');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    }
                  }} 
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}
                >
                  <div className="stars-gold" style={{ color: '#c9a84c', letterSpacing: '2px', fontSize: '0.95rem' }}>
                    {renderStars(reviewStats.average)}
                  </div>
                  <span className="rating-text" style={{ fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>
                    {reviewStats.average} ({reviewStats.total} {reviewStats.total === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              )}
              <div className="meta-row">
                <span className={displayStock > 0 ? 'in-stock' : 'out-of-stock'}>
                  {displayStock > 0 ? 'In Stock' : 'Out of Stock'}
                </span>
                <span>SKU: {displaySku}</span>
              </div>
            </div>

            <div className="price-box">
              <span className="main-price">₹{displayPrice?.toLocaleString('en-IN')}</span>
              {displayComparePrice > displayPrice && (
                <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '0.9rem', marginRight: '10px' }}>
                  ₹{displayComparePrice?.toLocaleString('en-IN')}
                </span>
              )}
              <span className="tax-info">MRP Inclusive of all taxes. Shipping calculated at checkout.</span>
            </div>

            {displayStock > 0 && displayStock < 15 && (
              <div className="urgency-badge">Hurry, Only {displayStock} left!</div>
            )}

            {/* Attributes */}
            {product.attributes?.filter(a => a.isVariation).map(attr => (
              <div key={attr.name} style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="attr-label">{attr.name}: {selectedAttrs[attr.name]}</span>
                  {attr.name.toLowerCase() === 'size' && (product.subCategory?.sizeChart || product.category?.sizeChart) && (
                    <button 
                      onClick={() => setShowSizeGuide(true)}
                      style={{ background: 'none', border: 'none', color: 'var(--maroon)', fontSize: '0.75rem', fontWeight: '700', textDecoration: 'underline', cursor: 'pointer' }}
                    >
                      VIEW SIZE GUIDE
                    </button>
                  )}
                </div>
                <div className="box-selector">
                  {attr.values?.map(val => {
                    const isSelected = selectedAttrs[attr.name] === val;
                    if (attr.type === 'color' || attr.name.toLowerCase() === 'color') {
                      const swatch = attr.swatches?.find(s => s.value === val);
                      return (
                        <div key={val} 
                          className={`color-swatch-box ${isSelected ? 'active' : ''}`}
                          onClick={() => handleAttrChange(attr.name, val)}
                        >
                          <div className="color-swatch-inner" style={{ background: swatch?.color || val.toLowerCase() }}></div>
                        </div>
                      );
                    }
                    return (
                      <div key={val} 
                        className={`box-item ${isSelected ? 'active' : ''}`}
                        onClick={() => handleAttrChange(attr.name, val)}
                      >
                        {val}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="action-stack">
              <button className="btn-atc" onClick={() => handleAddToCart('cart')} disabled={displayStock === 0}>
                ADD TO CART
              </button>
              <button className="btn-buy" onClick={() => handleAddToCart('buy')} disabled={displayStock === 0}>
                BUY NOW <span style={{ fontSize: '1rem' }}>🛒</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
              <button onClick={handleWishlist} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isInWishlist ? '❤️' : '🤍'} Add to Wishlist
              </button>
            </div>

            <div className="shipping-info">
              <span>🚚</span> You have got <strong>FREE SHIPPING</strong>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="product-tabs">
          <div className="tabs-header">
            <button className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>PRODUCT DETAILS</button>
            <button className={`tab-btn ${activeTab === 'shipping' ? 'active' : ''}`} onClick={() => setActiveTab('shipping')}>SHIPPING & RETURNS</button>
            <button className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>REVIEWS ({reviewStats.total})</button>
          </div>
          <div className="tab-content">
            {activeTab === 'details' && (
              <div>
                <p style={{ lineHeight: '1.8', color: '#666', marginBottom: '30px' }}>{product.description}</p>
                <table className="specs-table">
                  <tbody>
                    <tr><td>SKU</td><td>{displaySku}</td></tr>
                    <tr><td>Category</td><td>{product.category?.name}</td></tr>
                    <tr><td>Brand</td><td>{product.brand || 'MELORAA'}</td></tr>
                    {product.attributes?.filter(a => !a.isVariation && a.isVisible).map(a => (
                      <tr key={a.name}><td>{a.name}</td><td>{a.value}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {activeTab === 'shipping' && (
              <div style={{ color: '#666', lineHeight: '1.8' }}>
                <p>Enjoy free shipping on all orders above ₹999. Orders are usually dispatched within 24-48 hours.</p>
                <p>Easy 7-day returns and exchanges. Items must be unworn and with original tags.</p>
              </div>
            )}
            {activeTab === 'reviews' && (
              <div className="reviews-tab-container">
                <div className="reviews-split-grid">
                  <div className="reviews-stats-card">
                    <h3>Customer Ratings</h3>
                    <div className="stats-large-num">{reviewStats.average}</div>
                    <div className="stars-gold-big" style={{ color: '#c9a84c', fontSize: '1.5rem', letterSpacing: '3px', margin: '10px 0' }}>
                      {renderStars(reviewStats.average)}
                    </div>
                    <p style={{ color: '#888', fontSize: '0.85rem' }}>Based on {reviewStats.total} {reviewStats.total === 1 ? 'review' : 'reviews'}</p>
                    <div className="rating-bars-dist">
                      {[5, 4, 3, 2, 1].map(stars => {
                        const count = reviews.filter(r => r.rating === stars).length;
                        const percentage = reviewStats.total > 0 ? (count / reviews.length) * 100 : 0;
                        return (
                          <div key={stars} className="dist-row">
                            <span className="dist-label">{stars} ★</span>
                            <div className="dist-bar-track">
                              <div className="dist-bar-fill" style={{ width: `${percentage}%` }}></div>
                            </div>
                            <span className="dist-count">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="reviews-form-card">
                    <h3>Write a Review</h3>
                    {user ? (
                      <form onSubmit={handleSubmitReview} className="review-submit-form">
                        <div className="form-group-review">
                          <label>Rating</label>
                          <div className="rating-input-stars">
                            {[1, 2, 3, 4, 5].map(val => (
                              <button
                                type="button"
                                key={val}
                                className={`star-input-btn ${reviewForm.rating >= val ? 'active' : ''}`}
                                onClick={() => setReviewForm({ ...reviewForm, rating: val })}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="form-group-review">
                          <label htmlFor="review-title">Review Title</label>
                          <input
                            id="review-title"
                            type="text"
                            placeholder="Summarize your experience..."
                            value={reviewForm.title}
                            onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                            required
                          />
                        </div>
                        <div className="form-group-review">
                          <label htmlFor="review-comment">Review Comments</label>
                          <textarea
                            id="review-comment"
                            rows="4"
                            placeholder="What did you like or dislike? Write your review here..."
                            value={reviewForm.comment}
                            onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                          />
                        </div>
                        <button type="submit" className="btn-submit-review">SUBMIT REVIEW</button>
                      </form>
                    ) : (
                      <div className="login-prompt-box">
                        <p>You must be signed in to submit a product review.</p>
                        <Link to="/login" className="btn-login-redirect">LOG IN / REGISTER</Link>
                      </div>
                    )}
                  </div>
                </div>

                <hr className="reviews-divider" />

                <div className="reviews-list-block">
                  <h3>Customer Reviews ({reviews.length})</h3>
                  {reviews.length === 0 ? (
                    <p style={{ color: '#888', fontStyle: 'italic', padding: '20px 0' }}>No reviews yet for this product. Be the first to share your thoughts!</p>
                  ) : (
                    <div className="reviews-list-container">
                      {reviews.map((rev) => (
                        <div key={rev._id} className="review-card">
                          <div className="review-card-header">
                            <div className="review-author-info">
                              <span className="author-name">{rev.user?.name || rev.userName || 'Anonymous'}</span>
                              {rev.verifiedPurchase && <span className="verified-badge">✓ Verified Buyer</span>}
                            </div>
                            <span className="review-date">{new Date(rev.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                          </div>
                          <div className="review-card-stars" style={{ color: '#c9a84c', letterSpacing: '2px', margin: '5px 0 10px' }}>
                            {renderStars(rev.rating)}
                          </div>
                          <h4 className="review-title-text">{rev.title}</h4>
                          <p className="review-comment-text">{rev.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Size Guide Modal - Modern & Interactive Sizing Matrix */}
      {showSizeGuide && (
        <div className="size-guide-modal-overlay" onClick={() => setShowSizeGuide(false)}>
          <div className="size-guide-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="size-guide-close-btn" onClick={() => setShowSizeGuide(false)}>×</button>
            
            <div className="size-guide-header">
              <h2>Interactive Size Guide</h2>
              <p className="sub-tag">{product.subCategory?.name || product.category?.name || 'Apparel & Dresswear'}</p>
            </div>

            {/* Units Toggle Switcher */}
            <div className="size-unit-toggle-wrapper">
              <span className="toggle-label">Measurement Unit:</span>
              <div className="toggle-buttons">
                <button 
                  className={`unit-toggle-btn ${sizeUnit === 'in' ? 'active' : ''}`}
                  onClick={() => setSizeUnit('in')}
                >
                  Inches (in)
                </button>
                <button 
                  className={`unit-toggle-btn ${sizeUnit === 'cm' ? 'active' : ''}`}
                  onClick={() => setSizeUnit('cm')}
                >
                  Centimeters (cm)
                </button>
              </div>
            </div>

            <div className="size-guide-split-body">
              {/* Left Column: Sizing matrix table */}
              <div className="sizing-table-panel">
                <div className="table-responsive">
                  <table className="sizing-matrix-table">
                    <thead>
                      <tr>
                        <th>Size</th>
                        <th>Bust</th>
                        <th>Waist</th>
                        <th>Hips</th>
                        <th>Length</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { size: 'XS', bust: 32, waist: 25, hips: 35, length: 36 },
                        { size: 'S', bust: 34, waist: 27, hips: 37, length: 36.5 },
                        { size: 'M', bust: 36, waist: 29, hips: 39, length: 37 },
                        { size: 'L', bust: 38, waist: 31, hips: 41, length: 37.5 },
                        { size: 'XL', bust: 40, waist: 33, hips: 43, length: 38 },
                        { size: 'XXL', bust: 42, waist: 35, hips: 45, length: 38.5 }
                      ].map((row) => (
                        <tr key={row.size}>
                          <td className="size-cell">{row.size}</td>
                          <td>{sizeUnit === 'in' ? `${row.bust}"` : `${Math.round(row.bust * 2.54)}`}</td>
                          <td>{sizeUnit === 'in' ? `${row.waist}"` : `${Math.round(row.waist * 2.54)}`}</td>
                          <td>{sizeUnit === 'in' ? `${row.hips}"` : `${Math.round(row.hips * 2.54)}`}</td>
                          <td>{sizeUnit === 'in' ? `${row.length}"` : `${Math.round(row.length * 2.54)}`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="size-disclaimer">
                  * Note: Sizing charts are for guideline purposes only. Standard variations of 0.5 inches may occur. If you are between sizes, we recommend selecting the larger size for a relaxed premium fit.
                </p>
              </div>

              {/* Right Column: How to Measure and Silhouette Visual panel */}
              <div className="visual-guideline-panel">
                <div className="silhouette-svg-container">
                  <svg viewBox="0 0 150 280" width="100%" height="240">
                    <path 
                      d="M 75,15 C 80,15 84,19 84,25 C 84,31 80,36 75,36 C 70,36 66,31 66,25 C 66,19 70,15 75,15 Z 
                         M 68,36 C 60,41 55,50 55,63 L 58,103 C 58,103 62,94 65,99 C 67,101 64,130 64,150 C 64,150 55,178 55,240 L 67,240 L 71,185 L 75,185 L 79,185 L 83,240 L 95,240 C 95,178 86,150 86,150 C 86,130 83,101 85,99 C 88,94 92,103 92,103 L 95,63 C 95,50 90,41 82,36 Z" 
                      fill="none" 
                      stroke="#c9a84c" 
                      strokeWidth="2.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                    <line x1="42" y1="75" x2="108" y2="75" stroke="#4f0c10" strokeWidth="1.5" strokeDasharray="3,3" />
                    <circle cx="75" cy="75" r="3" fill="#4f0c10" />
                    <text x="112" y="78" fill="#c9a84c" fontSize="11" fontWeight="bold">1</text>
                    
                    <line x1="50" y1="108" x2="100" y2="108" stroke="#4f0c10" strokeWidth="1.5" strokeDasharray="3,3" />
                    <circle cx="75" cy="108" r="3" fill="#4f0c10" />
                    <text x="104" y="111" fill="#c9a84c" fontSize="11" fontWeight="bold">2</text>
                    
                    <line x1="47" y1="145" x2="103" y2="145" stroke="#4f0c10" strokeWidth="1.5" strokeDasharray="3,3" />
                    <circle cx="75" cy="145" r="3" fill="#4f0c10" />
                    <text x="107" y="148" fill="#c9a84c" fontSize="11" fontWeight="bold">3</text>
                    
                    <line x1="61" y1="48" x2="61" y2="200" stroke="#4f0c10" strokeWidth="1.5" strokeDasharray="3,3" />
                    <circle cx="61" cy="48" r="3" fill="#4f0c10" />
                    <circle cx="61" cy="200" r="3" fill="#4f0c10" />
                    <text x="47" y="128" fill="#c9a84c" fontSize="11" fontWeight="bold">4</text>
                  </svg>
                </div>
                <div className="how-to-measure-list">
                  <h4>How To Measure</h4>
                  <div className="measure-step">
                    <span className="step-num">1</span>
                    <div>
                      <strong>Bust:</strong> Measure around the fullest part of your chest, keeping the measuring tape horizontal.
                    </div>
                  </div>
                  <div className="measure-step">
                    <span className="step-num">2</span>
                    <div>
                      <strong>Waist:</strong> Measure around your natural waistline, keeping the tape comfortably loose.
                    </div>
                  </div>
                  <div className="measure-step">
                    <span className="step-num">3</span>
                    <div>
                      <strong>Hips:</strong> Measure around the fullest part of your hips, keeping feet together.
                    </div>
                  </div>
                  <div className="measure-step">
                    <span className="step-num">4</span>
                    <div>
                      <strong>Length:</strong> Measured from the high shoulder point to the hemline.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
