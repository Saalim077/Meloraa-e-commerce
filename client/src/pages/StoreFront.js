import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToCart, openCart } from '../store';
import api from '../utils/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductFilters from '../components/ProductFilters';
import CategorySection from '../components/CategorySection';
import '../styles/storefront.css';

export default function StoreFront() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedSale, setSelectedSale] = useState(null); // 'sale', 'regular'
  const [selectedAttrs, setSelectedAttrs] = useState({}); // { Color: ['Red'], Size: ['M'] }
  const [selectedRating, setSelectedRating] = useState(0);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search') || '';
    setSearchTerm(searchParam);

    const categoryParam = params.get('category') || '';
    if (categoryParam) {
      if (categoryParam === 'sale') {
        setSelectedSale('sale');
        setSelectedCategory(null);
      } else {
        if (categories.length > 0) {
          const match = categories.find(
            c => c._id === categoryParam || c.name.toLowerCase() === categoryParam.toLowerCase() || c.slug === categoryParam
          );
          if (match) {
            setSelectedCategory(match._id);
            setSelectedSale(null);
          }
        }
      }
    }
  }, [location.search, categories]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [catRes, settingsRes, prodRes] = await Promise.all([
        api.get('/categories'),
        api.get('/settings'),
        api.get('/products')
      ]);
      setCategories(catRes.data.categories || []);
      setSettings(settingsRes.data || null);
      setProducts(prodRes.data.products || []);
    } catch (err) {
      console.error('Core data error:', err.message);
      setError('Failed to load store data');
    } finally {
      setLoading(false);
    }
  };

  const toggleAttrFilter = (attrName, value) => {
    setSelectedAttrs(prev => {
      const current = prev[attrName] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [attrName]: updated };
    });
  };

  const filteredProducts = products.filter(p => {
    // Search
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;

    // Category
    if (selectedCategory) {
      const pCatId = p.category?._id || p.category;
      const productCat = categories.find(c => c._id === pCatId);
      const isDirect = pCatId === selectedCategory;
      const isParent = productCat && productCat.parent === selectedCategory;
      if (!isDirect && !isParent) return false;
    }

    // SubCategory
    if (selectedSubCategory) {
      const pCatId = p.category?._id || p.category;
      if (pCatId !== selectedSubCategory && p.subCategory !== selectedSubCategory) return false;
    }

    // Brand
    if (selectedBrand && p.brand !== selectedBrand) return false;

    // Price
    const price = p.salePrice || p.price;
    if (priceRange.min !== '' && priceRange.min !== null && priceRange.min !== undefined && price < Number(priceRange.min)) return false;
    if (priceRange.max !== '' && priceRange.max !== null && priceRange.max !== undefined && price > Number(priceRange.max)) return false;

    // Sale
    if (selectedSale === 'sale' && !p.isOnSale) return false;
    if (selectedSale === 'regular' && p.isOnSale) return false;

    // Rating
    if (selectedRating > 0 && (p.meta?.averageRating || 0) < selectedRating) return false;

    // Attributes
    for (const attrName of Object.keys(selectedAttrs)) {
      const selectedValues = selectedAttrs[attrName];
      if (selectedValues.length === 0) continue;

      const productAttr = p.attributes?.find(a => a.name === attrName);
      if (!productAttr) return false;

      // Check both .value (single) and .values (array)
      const attrValues = productAttr.values?.length > 0 ? productAttr.values : [productAttr.value];
      const hasMatch = selectedValues.some(v => attrValues.includes(v));
      if (!hasMatch) return false;
    }

    return true;
  });

  const getProductImage = (product) => {
    if (product.mainImage) return product.mainImage;
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    if (product.image) return product.image;
    return 'https://placehold.co/300x300?text=No+Image';
  };

  const getInclusivePrice = (product) => {
    let price = product.price || 0;
    if (!settings || !settings.taxEnabled || settings.taxInclusive) return price;

    let rate = settings.taxRate || 0;
    if (product.taxClass && settings.taxClasses) {
      const tc = settings.taxClasses.find(c => c.name === product.taxClass);
      if (tc) rate = tc.rate;
    }

    return Math.round(price * (1 + rate / 100));
  };

  return (
    <div className="storefront">
      <Header />

      <div className="hero-banner">
        <div className="hero-content">
          <p className="hero-subtitle">NEW COLLECTION '24</p>
          <h1>EMBRACE THE ELEGANCE</h1>
          <button className="btn-hero-discover" onClick={() => navigate('/shop')}>DISCOVER NOW</button>
        </div>
      </div>





      <div className="store-container">
        <div className={`filter-overlay ${filterDrawerOpen ? 'open' : ''}`} onClick={() => setFilterDrawerOpen(false)} />
        <ProductFilters
          products={products}
          categories={categories}
          settings={settings}
          filterProps={{
            selectedCategory, setSelectedCategory,
            selectedSubCategory, setSelectedSubCategory,
            selectedBrand, setSelectedBrand,
            priceRange, setPriceRange,
            selectedSale, setSelectedSale,
            selectedAttrs, setSelectedAttrs,
            selectedRating, setSelectedRating,
            setSearchTerm, toggleAttrFilter
          }}
          isOpen={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
        />

        <main className="store-main">
          <div className="store-action-bar">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <button className="btn-filter-toggle" onClick={() => setFilterDrawerOpen(true)}>
              <span className="filter-icon">⚙️</span> Filters
            </button>
          </div>

          {error && <div style={{ color: '#ff6b6b', padding: '20px' }}>⚠️ {error}</div>}

          {loading ? (
            <div className="loading-center">
              <div className="spinner spinner-lg" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="no-products">
              <p>No products found</p>
              <p style={{ fontSize: '0.85rem', color: '#999' }}>
                Total: {products.length} | Categories: {categories.length}
              </p>
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map(product => (
                <div key={product._id} className="product-card">
                  <div className="product-image-wrapper">
                    <Link to={`/product/${product._id}`} className="product-image-link">
                      <img
                        src={getProductImage(product)}
                        alt={product.name}
                        className="product-image"
                        onError={(e) => { e.target.src = 'https://placehold.co/400x533?text=Image+Not+Found'; }}
                      />
                    </Link>
                    <div className="product-action-overlay">
                      <button className="action-btn" title="Add to Wishlist">
                        <i className="far fa-heart"></i>
                      </button>
                      <button 
                        className="action-btn" 
                        title="Add to Cart"
                        onClick={() => {
                          const finalPrice = getInclusivePrice(product);
                          dispatch(addToCart({
                            _id: product._id,
                            productId: product._id,
                            name: product.name,
                            price: product.price, // Keep base price for checkout extraction if needed, but display is handled by settings
                            image: getProductImage(product),
                            taxClass: product.taxClass || ''
                          }));
                          dispatch(openCart());
                        }}
                      >
                        <i className="fas fa-shopping-cart"></i>
                      </button>
                      <button className="action-btn" title="Quick View" onClick={() => navigate(`/product/${product._id}`)}>
                        <i className="fas fa-search-plus"></i>
                      </button>
                    </div>
                  </div>
                  <div className="product-info">
                    <Link to={`/product/${product._id}`} className="product-name-link">
                      <h4 className="product-name">{product.name}</h4>
                    </Link>
                    <p className="product-category">{product.category?.name || 'N/A'}</p>
                    <p className="product-price">₹{getInclusivePrice(product).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}
