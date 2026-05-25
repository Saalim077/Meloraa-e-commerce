import React from 'react';

export default function ProductFilters({
    products,
    categories,
    settings,
    filterProps,
    isOpen,
    onClose
}) {
    const {
        selectedCategory, setSelectedCategory,
        selectedSubCategory, setSelectedSubCategory,
        selectedBrand, setSelectedBrand,
        priceRange, setPriceRange,
        selectedSale, setSelectedSale,
        selectedAttrs, setSelectedAttrs,
        selectedRating, setSelectedRating,
        setSearchTerm, toggleAttrFilter
    } = filterProps;

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            {/* Drawer Header for Mobile */}
            <div className="filter-drawer-header">
                <h3>Filters</h3>
                <button className="filter-close-btn" onClick={onClose}>&times;</button>
            </div>
            {(!settings || !settings.shopFilters || settings.shopFilters.length === 0) ? (
                <>
                    <h3>Categories</h3>
                    <button className={`category-btn ${!selectedCategory ? 'active' : ''}`} onClick={() => setSelectedCategory(null)}>All Products</button>
                    {categories.filter(c => !c.parent).map(cat => (
                        <button key={cat._id} className={`category-btn ${selectedCategory === cat._id ? 'active' : ''}`} onClick={() => setSelectedCategory(cat._id)}>{cat.name}</button>
                    ))}
                </>
            ) : (
                settings.shopFilters.filter(f => f.active).sort((a, b) => a.order - b.order).map(filter => (
                    <div key={filter.id} className="filter-section">
                        <h3 className="filter-title">{filter.label}</h3>

                        {filter.type === 'category' && (
                            <div className="filter-options">
                                <label className="filter-checkbox-label">
                                    <input type="checkbox" checked={!selectedCategory} onChange={() => setSelectedCategory(null)} />
                                    <span className="checkbox-text">All <span className="count">({products.length})</span></span>
                                </label>
                                {categories.filter(c => !c.parent).map(cat => {
                                    const count = products.filter(p => {
                                        const pCatId = p.category?._id || p.category;
                                        const productCat = categories.find(c => c._id === pCatId);
                                        return pCatId === cat._id || (productCat && productCat.parent === cat._id);
                                    }).length;
                                    return (
                                        <label key={cat._id} className="filter-checkbox-label">
                                            <input type="checkbox" checked={selectedCategory === cat._id} onChange={() => setSelectedCategory(cat._id === selectedCategory ? null : cat._id)} />
                                            <span className="checkbox-text">{cat.name} <span className="count">({count})</span></span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}

                        {filter.type === 'price' && (() => {
                            // Calculate max price dynamically from products list
                            const maxPrice = products.length > 0 ? Math.max(...products.map(p => p.salePrice || p.price || 0), 10000) : 10000;
                            const minPrice = 0;

                            const minVal = priceRange.min === '' ? minPrice : Number(priceRange.min);
                            const maxVal = priceRange.max === '' || priceRange.max === '999999' ? maxPrice : Number(priceRange.max);

                            const minPercent = ((minVal - minPrice) / (maxPrice - minPrice)) * 100;
                            const maxPercent = ((maxVal - minPrice) / (maxPrice - minPrice)) * 100;

                            return (
                                <div className="price-slider-filter-wrapper">
                                    {/* Top labels */}
                                    <div className="price-slider-labels top-labels">
                                        <span>₹{minVal}</span>
                                        <span>₹{maxVal}</span>
                                    </div>

                                    {/* Slider track and thumbs */}
                                    <div className="price-slider-track-container">
                                        <input
                                            type="range"
                                            min={minPrice}
                                            max={maxPrice}
                                            value={minVal}
                                            onChange={(e) => {
                                                const value = Math.min(Number(e.target.value), maxVal - 50);
                                                setPriceRange(p => ({ ...p, min: String(value) }));
                                            }}
                                            className="price-slider-thumb thumb-left"
                                        />
                                        <input
                                            type="range"
                                            min={minPrice}
                                            max={maxPrice}
                                            value={maxVal}
                                            onChange={(e) => {
                                                const value = Math.max(Number(e.target.value), minVal + 50);
                                                setPriceRange(p => ({ ...p, max: String(value) }));
                                            }}
                                            className="price-slider-thumb thumb-right"
                                        />
                                        <div className="price-slider-track-bg" />
                                        <div
                                            className="price-slider-track-range"
                                            style={{
                                                left: `${minPercent}%`,
                                                width: `${maxPercent - minPercent}%`
                                            }}
                                        />
                                    </div>

                                    {/* Bottom labels */}
                                    <div className="price-slider-labels bottom-labels">
                                        <span>₹{minVal}</span>
                                        <span>₹{maxVal}</span>
                                    </div>
                                </div>
                            );
                        })()}

                        {filter.type === 'sale' && (
                            <div className="filter-options">
                                <label className="filter-checkbox-label">
                                    <input type="checkbox" checked={selectedSale === 'sale'} onChange={() => setSelectedSale(selectedSale === 'sale' ? null : 'sale')} />
                                    <span className="checkbox-text">On Sale</span>
                                </label>
                                <label className="filter-checkbox-label">
                                    <input type="checkbox" checked={selectedSale === 'regular'} onChange={() => setSelectedSale(selectedSale === 'regular' ? null : 'regular')} />
                                    <span className="checkbox-text">Regular</span>
                                </label>
                            </div>
                        )}

                        {filter.type === 'attribute' && (() => {
                            const attrName = filter.id.replace('attr_', '');
                            const attrDef = settings.commonAttributes?.find(a => a.name === attrName);
                            if (!attrDef) return null;
                            return (
                                <div className="filter-options">
                                    {attrDef.values.map(val => {
                                        const count = products.filter(p => {
                                            const productAttr = p.attributes?.find(a => a.name === attrName);
                                            if (!productAttr) return false;
                                            const attrValues = productAttr.values?.length > 0 ? productAttr.values : [productAttr.value];
                                            return attrValues.includes(val);
                                        }).length;
                                        const isChecked = selectedAttrs[attrName]?.includes(val);
                                        const swatch = attrDef.swatches?.find(s => s.value === val);

                                        return (
                                            <label key={val} className="filter-checkbox-label">
                                                <input type="checkbox" checked={isChecked} onChange={() => toggleAttrFilter(attrName, val)} />
                                                <div className="checkbox-text-wrapper">
                                                    {attrDef.type === 'color' && swatch?.color && (
                                                        <span className="color-dot" style={{ backgroundColor: swatch.color }}></span>
                                                    )}
                                                    {attrDef.type === 'image' && swatch?.image && (
                                                        <img src={swatch.image} alt={val} className="filter-image-preview" />
                                                    )}
                                                    <span className="checkbox-text">{val} <span className="count">({count})</span></span>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            );
                        })()}

                        {filter.type === 'subCategory' && (
                            <div className="filter-options">
                                <label className="filter-checkbox-label">
                                    <input type="checkbox" checked={!selectedSubCategory} onChange={() => setSelectedSubCategory(null)} />
                                    <span className="checkbox-text">All <span className="count">({products.length})</span></span>
                                </label>
                                {categories.filter(c => c.parent).map(cat => {
                                    const count = products.filter(p => {
                                        const pCatId = p.category?._id || p.category;
                                        return pCatId === cat._id || p.subCategory === cat._id;
                                    }).length;
                                    if (count === 0) return null;
                                    return (
                                        <label key={cat._id} className="filter-checkbox-label">
                                            <input type="checkbox" checked={selectedSubCategory === cat._id} onChange={() => setSelectedSubCategory(cat._id === selectedSubCategory ? null : cat._id)} />
                                            <span className="checkbox-text">{cat.name} <span className="count">({count})</span></span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}

                        {filter.type === 'brand' && (
                            <div className="filter-options">
                                <label className="filter-checkbox-label">
                                    <input type="checkbox" checked={!selectedBrand} onChange={() => setSelectedBrand(null)} />
                                    <span className="checkbox-text">All <span className="count">({products.length})</span></span>
                                </label>
                                {[...new Set(products.map(p => p.brand).filter(b => b))].sort().map(brand => {
                                    const count = products.filter(p => p.brand === brand).length;
                                    return (
                                        <label key={brand} className="filter-checkbox-label">
                                            <input type="checkbox" checked={selectedBrand === brand} onChange={() => setSelectedBrand(brand)} />
                                            <span className="checkbox-text">{brand} <span className="count">({count})</span></span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}

                        {filter.type === 'rating' && (
                            <div className="filter-options">
                                {[5, 4, 3, 2, 1].map(star => {
                                    const count = products.filter(p => (p.ratings?.average || 0) >= star).length;
                                    return (
                                        <label key={star} className="filter-checkbox-label rating-label">
                                            <input type="checkbox" checked={selectedRating === star} onChange={() => setSelectedRating(selectedRating === star ? 0 : star)} />
                                            <div className="stars">
                                                {[...Array(5)].map((_, i) => (
                                                    <span key={i} className={`star ${i < star ? 'filled' : ''}`}>★</span>
                                                ))}
                                            </div>
                                            <span className="count">({count})</span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))
            )}

            <button className="btn btn-primary btn-full" style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => {
                setSelectedCategory(null);
                setSelectedSubCategory(null);
                setSelectedBrand(null);
                setPriceRange({ min: '', max: '' });
                setSelectedSale(null);
                setSelectedAttrs({});
                setSelectedRating(0);
                setSearchTerm('');
            }}>
                <span style={{ fontSize: '1.2rem' }}>🔄</span> RESET FILTERS
            </button>
        </aside>
    );
}
