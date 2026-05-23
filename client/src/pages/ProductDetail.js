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
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetchProduct();
    fetchSettings();
  }, [id]);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      setSettings(res.data);
    } catch (e) { console.error('Settings fetch error', e); }
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

          {/* Main Image Stage */}
          <div className="main-stage">
            <img src={activeImage} alt={product.name} />
          </div>

          {/* Sticky Sidebar Info */}
          <div className="sticky-sidebar">
            <div className="product-header">
              <h1>{product.name}</h1>
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
          </div>
          <div className="tab-content">
            {activeTab === 'details' ? (
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
            ) : (
              <div style={{ color: '#666', lineHeight: '1.8' }}>
                <p>Enjoy free shipping on all orders above ₹999. Orders are usually dispatched within 24-48 hours.</p>
                <p>Easy 7-day returns and exchanges. Items must be unworn and with original tags.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Size Guide Modal - Full View Aesthetic */}
      {showSizeGuide && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(26, 25, 23, 0.98)', zIndex: 99999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.3s ease'
        }}>
          {/* Top Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px', color: 'white' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', marginBottom: '10px' }}>Size Guide</h2>
            <p style={{ color: '#888', fontSize: '1rem', letterSpacing: '0.1em' }}>{product.subCategory?.name || product.category?.name}</p>
          </div>

          {/* Centered Image Content */}
          <div style={{ maxWidth: '900px', width: '95%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img 
              src={product.subCategory?.sizeChart || product.category?.sizeChart} 
              alt="Size Chart" 
              style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', filter: 'brightness(1.1)' }} 
            />
          </div>

          <p style={{ marginTop: '30px', color: '#666', fontSize: '0.85rem', textAlign: 'center', maxWidth: '600px', lineHeight: '1.6' }}>
            These are body measurements. All measurements are in inches. <br/>
            If you are between sizes, we recommend choosing the larger size.
          </p>

          {/* Bottom Close Button */}
          <button 
            onClick={() => setShowSizeGuide(false)} 
            style={{ 
              marginTop: '50px',
              width: '50px', height: '50px', 
              borderRadius: '50%', 
              background: 'white', 
              color: 'black', 
              border: 'none', 
              fontSize: '1.5rem', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              transition: 'transform 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            ×
          </button>
        </div>
      )}

      <Footer />
    </>
  );
}
