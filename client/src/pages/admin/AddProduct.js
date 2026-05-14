import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { productAPI, categoryAPI, uploadAPI, settingsAPI } from '../../utils/api';

const SECTIONS = ['Basic Info', 'Images', 'Pricing', 'Inventory', 'Variants', 'Attributes', 'SEO'];

const defaultForm = {
  name: '', slug: '', sku: '', hsnCode: '', brand: '', category: '', shortDescription: '', description: '',
  tags: [], isActive: true, isFeatured: false, isNewArrival: false, isOnSale: false, taxClass: '',
  mainImage: '', images: [],
  price: '', comparePrice: '', costPrice: '',
  stock: '', lowStockThreshold: 5, weight: '', dimensions: { length: '', width: '', height: '' },
  hasVariants: false, variants: [], attributes: [], defaultVariant: {},
  seo: { title: '', description: '', keywords: [] },
};

export default function AddProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(defaultForm);
  const [activeSection, setActiveSection] = useState(0);
  const [categories, setCategories] = useState([]);
  const [taxClasses, setTaxClasses] = useState([]);
  const [commonAttributes, setCommonAttributes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState({});
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [bulkVal, setBulkVal] = useState('');

  useEffect(() => {
    categoryAPI.getAll().then(r => setCategories(r.data.categories)).catch(() => { });
    settingsAPI.getSettings().then(r => {
      setTaxClasses(r.data.taxClasses || []);
      setCommonAttributes(r.data.commonAttributes || []);
    }).catch(() => { });
    if (id) {
      productAPI.getAll({ page: 1 }).then(r => {
        const p = r.data.products.find(p => p._id === id);
        if (p) setForm({ ...defaultForm, ...p });
      }).catch(() => { });
    }
  }, [id]);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const autoSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Product name is required';
    if (!form.sku.trim()) e.sku = 'SKU is required';
    if (!form.price || form.price <= 0) e.price = 'Valid price required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) { toast.error('Please fix validation errors'); setActiveSection(0); return; }
    setSaving(true);
    try {
      const data = { ...form, price: Number(form.price), comparePrice: Number(form.comparePrice) || 0, costPrice: Number(form.costPrice) || 0, stock: Number(form.stock) || 0 };
      if (id) await productAPI.update(id, data);
      else await productAPI.create(data);
      toast.success(id ? 'Product updated!' : 'Product created!');
      navigate('/admin/products');
    } catch (e) { toast.error(e.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const addTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      if (!form.tags.includes(tagInput.trim())) set('tags', [...form.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const addVariant = () => {
    const newVariant = { name: '', sku: '', price: '', comparePrice: '', stock: '', images: [], manageStock: true, isEnabled: true };
    set('variants', [...form.variants, newVariant]);
    setExpandedIdx(form.variants.length);
  };
  const updateVariant = (i, k, v) => { const vv = [...form.variants]; vv[i] = { ...vv[i], [k]: v }; set('variants', vv); };
  const removeVariant = (i) => set('variants', form.variants.filter((_, idx) => idx !== i));

  const addAttr = () => set('attributes', [...form.attributes, { name: '', value: '', values: [], isVisible: true, isVariation: false }]);
  const updateAttr = (i, k, v) => { const aa = [...form.attributes]; aa[i] = { ...aa[i], [k]: v }; set('attributes', aa); };
  const removeAttr = (i) => set('attributes', form.attributes.filter((_, idx) => idx !== i));

  const bulkUpdateVariants = (type, val) => {
    if (val === null && type !== 'delete') return;
    const vv = form.variants.map(v => ({
      ...v,
      [type]: type === 'price' || type === 'stock' || type === 'comparePrice' ? Number(val) : val
    }));
    if (type === 'delete') set('variants', []);
    else set('variants', vv);
    toast.success(`Bulk updated ${type}`);
  };

  const generateVariations = () => {
    const variantsToGenerate = form.attributes.filter(a => a.isVariation && a.values?.length > 0);
    if (variantsToGenerate.length === 0) return toast.error('No attributes marked for variations. Add values and check "Used for variations" in the Attributes tab.');

    function combine(idx, currentName) {
      if (idx === variantsToGenerate.length) return [currentName];
      let results = [];
      variantsToGenerate[idx].values.forEach(val => {
        results = results.concat(combine(idx + 1, currentName ? `${currentName} - ${val}` : val));
      });
      return results;
    }

    const names = combine(0, '');
    const newVariants = names.map(n => ({
      name: n,
      sku: `${form.sku}-${n.replace(/ /g, '')}`,
      price: form.price,
      comparePrice: form.comparePrice,
      stock: form.stock,
      images: [],
      manageStock: true,
      isEnabled: true
    }));

    set('variants', [...form.variants, ...newVariants]);
    toast.success(`Generated ${names.length} variations from attributes`);
  };

  const createValue = (i) => {
    const newVal = window.prompt('Enter new attribute value:');
    if (!newVal) return;
    const aa = [...form.attributes];
    const currentValues = aa[i].values || [];
    if (currentValues.includes(newVal.trim())) return toast.error('Value already exists');

    const updatedValues = [...currentValues, newVal.trim()];
    aa[i] = {
      ...aa[i],
      values: updatedValues,
      value: updatedValues.join(', ')
    };
    set('attributes', aa);
  };

  const addPresetAttr = (attrName) => {
    const preset = commonAttributes.find(a => a.name === attrName);
    if (preset) {
      set('attributes', [...form.attributes, {
        ...preset,
        value: preset.values.join(', '),
        isVisible: true,
        isVariation: preset.name === 'Size' || preset.name === 'Color' // Heuristic for variation usage
      }]);
    } else {
      set('attributes', [...form.attributes, { name: '', value: '', values: [], type: 'text', swatches: [], isVisible: true, isVariation: false }]);
    }
  };

  const margin = form.price && form.costPrice ? Math.round(((form.price - form.costPrice) / form.price) * 100) : null;

  const handleUpload = async (files, type = 'gallery', vIdx = null) => {
    const fd = new FormData();
    Array.from(files).forEach(f => fd.append('images', f));
    try {
      const res = await uploadAPI.upload(fd);
      const urls = res.data.urls;
      if (type === 'main') {
        set('mainImage', urls[0]);
      } else if (type === 'gallery') {
        set('images', [...form.images, ...urls]);
      } else if (type === 'variant') {
        const vv = [...form.variants];
        vv[vIdx].images = [...(vv[vIdx].images || []), ...urls];
        set('variants', vv);
      }
      toast.success('Images uploaded');
    } catch { toast.error('Upload failed'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/products')}>← Back</button>
        <div className="page-header" style={{ margin: 0, flex: 1 }}>
          <h1>{id ? 'Edit Product' : 'Add New Product'}</h1>
        </div>
        <button className="btn btn-gold" onClick={handleSubmit} disabled={saving}>
          {saving ? <><span className="spinner" /> Saving…</> : (id ? 'Update Product' : 'Publish Product')}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '24px' }}>
        {/* Section Nav */}
        <div className="card" style={{ height: 'fit-content', position: 'sticky', top: '80px' }}>
          <div className="card-body" style={{ padding: '12px' }}>
            {SECTIONS.map((s, i) => (
              <button key={s} onClick={() => setActiveSection(i)}
                style={{ width: '100%', display: 'block', padding: '10px 12px', borderRadius: 'var(--r-md)', fontSize: '0.85rem', textAlign: 'left', background: activeSection === i ? 'var(--ink-mid)' : 'none', border: 'none', color: activeSection === i ? 'var(--cream)' : 'var(--muted)', borderLeft: activeSection === i ? '2px solid var(--gold)' : '2px solid transparent', cursor: 'pointer', marginBottom: '2px', fontFamily: 'var(--font-body)', transition: 'var(--transition)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: activeSection === i ? 'var(--gold)' : 'var(--border-light)', marginRight: '8px' }}>0{i + 1}</span>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Section Content */}
        <div className="card">
          <div className="card-body">
            {/* 0: Basic Info */}
            {activeSection === 0 && (
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '24px' }}>Basic Information</h3>
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input className={`form-input ${errors.name ? 'error' : ''}`} value={form.name} placeholder="e.g. Versailles Silk Blouse"
                    onChange={e => { set('name', e.target.value); if (!form.slug) set('slug', autoSlug(e.target.value)); }} />
                  {errors.name && <p className="error-msg">{errors.name}</p>}
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Slug</label>
                    <input className="form-input" value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="auto-generated" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SKU *</label>
                    <input className={`form-input ${errors.sku ? 'error' : ''}`} value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="VSB-001" style={{ fontFamily: 'var(--font-mono)' }} />
                    {errors.sku && <p className="error-msg">{errors.sku}</p>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">HSN Code</label>
                    <input className="form-input" value={form.hsnCode || ''} onChange={e => set('hsnCode', e.target.value)} placeholder="e.g. 6204" style={{ fontFamily: 'var(--font-mono)' }} />
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Brand</label>
                    <input className="form-input" value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="Maison Élite" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-input" value={form.category} onChange={e => set('category', e.target.value)}>
                      <option value="">Select category</option>
                      {(() => {
                        const renderCategoryOptions = (items, depth = 0) => {
                          return items.map(cat => {
                            const children = categories.filter(c => c.parent === cat._id);
                            return (
                              <React.Fragment key={cat._id}>
                                <option value={cat._id}>
                                  {'\u00A0'.repeat(depth * 4)}{depth > 0 ? '↳ ' : ''}{cat.name}
                                </option>
                                {children.length > 0 && renderCategoryOptions(children, depth + 1)}
                              </React.Fragment>
                            );
                          });
                        };
                        return renderCategoryOptions(categories.filter(c => !c.parent));
                      })()}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Short Description</label>
                  <input className="form-input" value={form.shortDescription} onChange={e => set('shortDescription', e.target.value)} placeholder="One-line product summary" />
                </div>
                <div className="form-group">
                  <label className="form-label">Full Description</label>
                  <textarea className="form-input" value={form.description} onChange={e => set('description', e.target.value)} rows={5} placeholder="Detailed product description..." style={{ resize: 'vertical' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tags (press Enter to add)</label>
                  <input className="form-input" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag} placeholder="silk, luxury, blouse..." />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                    {form.tags.map(t => (
                      <span key={t} style={{ background: 'var(--ink-mid)', border: '1px solid var(--border)', borderRadius: '100px', padding: '3px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {t}
                        <button onClick={() => set('tags', form.tags.filter(x => x !== t))} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}>×</button>
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                  {[['isActive', 'Active'], ['isFeatured', 'Featured'], ['isNewArrival', 'New Arrival'], ['isOnSale', 'On Sale']].map(([field, label]) => (
                    <label key={field} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--ink-mid)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '12px', cursor: 'pointer' }}>
                      <span style={{ fontSize: '0.8rem', color: form[field] ? 'var(--cream)' : 'var(--muted)' }}>{label}</span>
                      <label className="toggle"><input type="checkbox" checked={form[field]} onChange={e => set(field, e.target.checked)} /><span className="toggle-slider" /></label>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* 1: Images */}
            {activeSection === 1 && (
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '24px' }}>Product Media</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '32px', marginBottom: '32px' }}>
                  {/* Main Image Slot */}
                  <div>
                    <label className="form-label" style={{ fontWeight: '700' }}>Product Main Image</label>
                    <div style={{ 
                      width: '100%', aspectRatio: '1', background: '#fcfaf7', border: '2px dashed #d8d0c5', 
                      borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', 
                      justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', position: 'relative'
                    }} onClick={() => document.getElementById('mainImgInput').click()}>
                      {form.mainImage ? (
                        <>
                          <img src={form.mainImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div className="img-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', opacity: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}>
                            <span style={{ color: 'white', fontSize: '0.8rem', fontWeight: '600' }}>Change Image</span>
                          </div>
                        </>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                          <span style={{ fontSize: '2rem' }}>🖼️</span>
                          <p style={{ fontSize: '0.8rem', color: '#6b665e', marginTop: '8px' }}>Set product image</p>
                        </div>
                      )}
                      <input type="file" id="mainImgInput" style={{ display: 'none' }} accept="image/*" onChange={e => handleUpload(e.target.files, 'main')} />
                    </div>
                    {form.mainImage && (
                      <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: '8px', color: '#d93025' }} onClick={() => set('mainImage', '')}>Remove main image</button>
                    )}
                  </div>

                  {/* Product Gallery */}
                  <div>
                    <label className="form-label" style={{ fontWeight: '700' }}>Product Gallery</label>
                    <div style={{ 
                      minHeight: '200px', background: '#fcfaf7', border: '2px dashed #d8d0c5', 
                      borderRadius: '12px', padding: '20px'
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px' }}>
                        {form.images.map((img, i) => (
                          <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e8e2db' }}>
                            <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button onClick={() => set('images', form.images.filter((_, idx) => idx !== i))}
                              style={{ position: 'absolute', top: '4px', right: '4px', width: '20px', height: '20px', background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', color: 'white', cursor: 'pointer', fontSize: '0.7rem' }}>×</button>
                          </div>
                        ))}
                        <label style={{ 
                          aspectRatio: '1', background: '#ffffff', border: '1px dashed #d8d0c5', 
                          borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                          cursor: 'pointer', fontSize: '1.5rem', color: '#d8d0c5' 
                        }}>
                          +
                          <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={e => handleUpload(e.target.files, 'gallery')} />
                        </label>
                      </div>
                      {form.images.length === 0 && (
                        <p style={{ textAlign: 'center', color: '#6b665e', fontSize: '0.8rem', marginTop: '40px' }}>Add product gallery images</p>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ background: '#fcfaf7', padding: '16px', borderRadius: '8px', border: '1px solid #e8e2db' }}>
                  <p style={{ fontSize: '0.8rem', color: '#6b665e' }}>
                    <strong>💡 Pro Tip:</strong> Use the primary image for the main listing and the gallery for multiple angles, lifestyle shots, or close-ups.
                  </p>
                </div>
              </div>
            )}

            {/* 2: Pricing */}
            {activeSection === 2 && (
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '24px' }}>Pricing</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Selling Price (₹) *</label>
                    <input className={`form-input ${errors.price ? 'error' : ''}`} type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="8500" style={{ fontFamily: 'var(--font-mono)' }} />
                    {errors.price && <p className="error-msg">{errors.price}</p>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Compare Price (₹)</label>
                    <input className="form-input" type="number" value={form.comparePrice} onChange={e => set('comparePrice', e.target.value)} placeholder="12000" style={{ fontFamily: 'var(--font-mono)' }} />
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '4px' }}>Original price shown with strikethrough</p>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cost Price (₹)</label>
                    <input className="form-input" type="number" value={form.costPrice} onChange={e => set('costPrice', e.target.value)} placeholder="4000" style={{ fontFamily: 'var(--font-mono)' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tax Class</label>
                    <select className="form-input" value={form.taxClass || ''} onChange={e => set('taxClass', e.target.value)}>
                      <option value="">Standard (Default)</option>
                      {taxClasses.map((tc, idx) => (
                        <option key={idx} value={tc.name}>{tc.name} ({tc.rate}%)</option>
                      ))}
                    </select>
                  </div>
                </div>
                {margin !== null && (
                  <div style={{ background: 'var(--ink-mid)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '16px', marginTop: '8px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '4px' }}>Profit Margin</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: '600', color: margin >= 40 ? 'var(--sage)' : margin >= 20 ? 'var(--gold)' : 'var(--red)' }}>
                      {margin}%
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Profit: ₹{form.price - form.costPrice} per unit</div>
                  </div>
                )}
              </div>
            )}

            {/* 3: Inventory */}
            {activeSection === 3 && (
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '24px' }}>Inventory</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Stock Quantity</label>
                    <input className="form-input" type="number" value={form.stock} onChange={e => set('stock', e.target.value)} placeholder="0" style={{ fontFamily: 'var(--font-mono)' }} />
                    {form.stock > 0 && (
                      <div style={{ marginTop: '8px', height: '4px', background: 'var(--border)', borderRadius: '2px' }}>
                        <div style={{ height: '100%', background: form.stock > 20 ? 'var(--sage)' : form.stock > 5 ? 'var(--gold)' : 'var(--red)', borderRadius: '2px', width: `${Math.min((form.stock / 100) * 100, 100)}%`, transition: 'width 0.3s' }} />
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Low Stock Alert</label>
                    <input className="form-input" type="number" value={form.lowStockThreshold} onChange={e => set('lowStockThreshold', e.target.value)} style={{ fontFamily: 'var(--font-mono)' }} />
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '4px' }}>Alert when stock falls below this</p>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Weight (grams)</label>
                    <input className="form-input" type="number" value={form.weight} onChange={e => set('weight', e.target.value)} placeholder="500" style={{ fontFamily: 'var(--font-mono)' }} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Dimensions (cm)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    {['length', 'width', 'height'].map(dim => (
                      <input key={dim} className="form-input" type="number" placeholder={dim} value={form.dimensions[dim]}
                        onChange={e => set('dimensions', { ...form.dimensions, [dim]: e.target.value })} style={{ fontFamily: 'var(--font-mono)' }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 4: Variants */}
            {activeSection === 4 && (
              <div>
                {/* Section Header & Toggle */}
                <div style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                  padding: '24px', background: '#fcfaf7', border: '1px solid #e8e2db', 
                  borderRadius: '12px', marginBottom: '32px', flexWrap: 'wrap', gap: '20px'
                }}>
                  <div style={{ flex: 1, minWidth: '300px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#1a1917', fontFamily: 'var(--font-display)' }}>Default Form Values</h4>
                      <span style={{ fontSize: '0.7rem', color: '#6b665e', background: '#f0ebe4', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>Optional</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                      {form.attributes.filter(a => a.isVariation).map(attr => (
                        <select
                          key={attr.name}
                          className="form-input"
                          style={{ width: 'auto', minWidth: '160px', height: '36px', fontSize: '0.85rem', background: '#ffffff', borderColor: '#d8d0c5' }}
                          value={form.defaultVariant?.[attr.name] || ''}
                          onChange={(e) => {
                            const newDefaults = { ...form.defaultVariant, [attr.name]: e.target.value };
                            set('defaultVariant', newDefaults);
                          }}
                        >
                          <option value="">No default {attr.name.toLowerCase()}</option>
                          {attr.values?.map(val => <option key={val} value={val}>{val}</option>)}
                        </select>
                      ))}
                    </div>
                  </div>

                  <label style={{ 
                    display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', 
                    padding: '12px 24px', background: form.hasVariants ? '#f0ebe4' : '#ffffff', 
                    border: '1px solid #d8d0c5', borderRadius: '30px', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: form.hasVariants ? 'inset 0 2px 4px rgba(0,0,0,0.05)' : 'none'
                  }}>
                    <input type="checkbox" checked={form.hasVariants} onChange={e => set('hasVariants', e.target.checked)} />
                    <span style={{ color: 'var(--maroon)', fontWeight: '700', fontSize: '0.75rem', letterSpacing: '1px' }}>VARIABLE PRODUCT</span>
                  </label>
                </div>

                {form.hasVariants && (
                  <div style={{ margin: '16px 0', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button className="btn btn-outline btn-sm" style={{ height: '32px' }} onClick={() => { if (window.confirm('Regenerate all variations?')) generateVariations(); }}>Regenerate variations</button>
                    <button className="btn btn-outline btn-sm" style={{ height: '32px' }} onClick={addVariant}>Add manually</button>
                    <select className="form-input" style={{ width: '150px', height: '32px' }} onChange={(e) => {
                      const action = e.target.value;
                      if (!action) return;
                      if (action === 'delete') { if (window.confirm('Delete all variations?')) bulkUpdateVariants('delete'); }
                      else {
                        const val = window.prompt(`Enter value for ${action}:`);
                        if (val !== null) bulkUpdateVariants(action, val);
                      }
                      e.target.value = '';
                    }}>
                      <option value="">Bulk actions</option>
                      <option value="price">Set Regular Prices</option>
                      <option value="comparePrice">Set Compare Prices</option>
                      <option value="stock">Set Inventory Stock</option>
                      <option value="isEnabled">Toggle Enabled Status</option>
                      <option value="manageStock">Toggle Manage Stock</option>
                      <option value="delete">Delete All Variations</option>
                    </select>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)', marginLeft: 'auto' }}>{form.variants.length} variations (Expand / Close)</span>
                  </div>
                )}

                {!form.hasVariants ? (
                  <div style={{ 
                    padding: '80px 40px', textAlign: 'center', background: '#fcfaf7', 
                    border: '1px dashed #d8d0c5', borderRadius: '16px', display: 'flex', 
                    flexDirection: 'column', alignItems: 'center' 
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '24px', opacity: 0.8 }}>📦</div>
                    <h3 style={{ textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.9rem', color: '#1a1917', marginBottom: '12px', fontWeight: '700' }}>This is a Simple Product</h3>
                    <p style={{ fontSize: '0.875rem', color: '#6b665e', maxWidth: '350px', lineHeight: '1.6', margin: '0 auto' }}>
                      Simple products have one price and one SKU. If you want to add sizes, colors, or other variations, toggle <strong>"Variable Product"</strong> above.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
                    {form.variants.map((v, i) => (
                      <div key={i} style={{ borderBottom: i === form.variants.length - 1 ? 'none' : '1px solid var(--border)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '20px', background: expandedIdx === i ? 'var(--ink-mid)' : 'none', transition: 'background 0.2s' }}>
                        <strong style={{ fontSize: '0.85rem', color: 'var(--muted)', width: '60px', fontFamily: 'var(--font-mono)' }}>#{3270 + i}</strong>

                        <div style={{ display: 'flex', gap: '12px', flex: 1, alignItems: 'center' }}>
                          {form.attributes.filter(a => a.isVariation).map((a, attrIdx) => {
                            const currentVal = v.name?.split(' - ')[attrIdx];
                            return (
                              <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <select className="form-input" style={{ width: '140px', height: '36px', fontSize: '0.9rem', padding: '0 12px', borderRadius: '4px', background: '#ffffff', borderColor: '#d8d0c5' }}
                                  value={currentVal}
                                  onChange={(e) => {
                                    let names = v.name?.split(' - ') || [];
                                    names[attrIdx] = e.target.value;
                                    updateVariant(i, 'name', names.join(' - '));
                                  }}>
                                  <option value="">Any {a.name}...</option>
                                  {a.values?.map(val => <option key={val} value={val}>{val}</option>)}
                                </select>
                              </div>
                            );
                          })}
                        </div>

                        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: '16px' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--red)', cursor: 'pointer', fontWeight: '500' }} onClick={() => removeVariant(i)}>Remove</span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--gold)', cursor: 'pointer', fontWeight: '500' }} onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}>Edit</span>
                          </div>
                          <span style={{ fontSize: '1rem', color: 'var(--muted)', cursor: 'grab' }}>☰</span>
                        </div>
                      </div>
                    ))}
                    {form.variants.map((v, i) => expandedIdx === i && (
                      <div key={`exp-${i}`} style={{ background: '#fcfaf7', padding: '32px', borderBottom: '1px solid #e8e2db', animation: 'fadeIn 0.3s ease' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '40px' }}>
                          {/* Variant Main Image */}
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ 
                              width: '150px', height: '150px', border: '1px solid #d8d0c5', borderRadius: '8px', 
                              overflow: 'hidden', marginBottom: '12px', background: '#ffffff', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }} onClick={() => document.getElementById(`v-img-${i}`).click()}>
                              {v.images?.[0] ? <img src={v.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '2rem' }}>🖼️</span>}
                            </div>
                            <input type="file" id={`v-img-${i}`} style={{ display: 'none' }} accept="image/*" onChange={e => handleUpload(e.target.files, 'variant', i)} />
                            <p style={{ fontSize: '0.7rem', color: '#6b665e' }}>Variant Thumbnail</p>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* Variant Gallery */}
                            <div>
                              <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem', marginBottom: '12px', display: 'block' }}>Variation Image Gallery</label>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                {v.images?.map((img, imgIdx) => (
                                  <div key={imgIdx} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e8e2db' }}>
                                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <button onClick={() => {
                                      const vv = [...form.variants];
                                      vv[i].images = vv[i].images.filter((_, idx) => idx !== imgIdx);
                                      set('variants', vv);
                                    }} style={{ position: 'absolute', top: '2px', right: '2px', width: '16px', height: '16px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', color: 'white', cursor: 'pointer', fontSize: '0.6rem' }}>×</button>
                                  </div>
                                ))}
                                <button className="btn btn-outline btn-sm" style={{ width: '80px', height: '80px', borderStyle: 'dashed', fontSize: '0.7rem' }}
                                  onClick={() => document.getElementById(`v-gal-${i}`).click()}>
                                  Add Images
                                </button>
                                <input type="file" id={`v-gal-${i}`} multiple style={{ display: 'none' }} accept="image/*" onChange={e => handleUpload(e.target.files, 'variant', i)} />
                              </div>
                            </div>

                            {/* Variant Inputs */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                              <div className="form-group">
                                <label className="form-label">SKU</label>
                                <input className="form-input" value={v.sku} onChange={e => updateVariant(i, 'sku', e.target.value)} placeholder="e.g. BLU-L-01" />
                              </div>
                              <div className="form-group">
                                <label className="form-label">Regular Price (₹)</label>
                                <input className="form-input" type="number" value={v.price} onChange={e => updateVariant(i, 'price', e.target.value)} />
                              </div>
                              <div className="form-group">
                                <label className="form-label">Sale Price (₹)</label>
                                <input className="form-input" type="number" value={v.comparePrice} onChange={e => updateVariant(i, 'comparePrice', e.target.value)} />
                              </div>
                              <div className="form-group">
                                <label className="form-label">Stock Status</label>
                                <input className="form-input" type="number" value={v.stock} onChange={e => updateVariant(i, 'stock', e.target.value)} disabled={!v.manageStock} />
                              </div>
                            </div>

                            {/* Toggles */}
                            <div style={{ display: 'flex', gap: '24px' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input type="checkbox" checked={v.isEnabled} onChange={e => updateVariant(i, 'isEnabled', e.target.checked)} />
                                <span style={{ fontSize: '0.85rem', color: '#1a1917' }}>Enabled</span>
                              </label>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input type="checkbox" checked={v.manageStock} onChange={e => updateVariant(i, 'manageStock', e.target.checked)} />
                                <span style={{ fontSize: '0.85rem', color: '#1a1917' }}>Manage stock?</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 5: Attributes */}
            {activeSection === 5 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => addPresetAttr('custom')}>Add new</button>
                    <select className="form-input" style={{ width: '200px', height: '32px', fontSize: '0.8rem', cursor: 'pointer' }}
                      onChange={(e) => {
                        if (e.target.value) {
                          addPresetAttr(e.target.value);
                          e.target.value = '';
                        }
                      }}>
                      <option value="">Common attributes...</option>
                      {commonAttributes.map(a => (
                        <option key={a.name} value={a.name}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)', cursor: 'pointer' }}>Expand / Close</div>
                </div>

                {!form.attributes || form.attributes.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)', border: '1px dashed var(--border)', borderRadius: 'var(--r-lg)' }}>
                    <p>No attributes yet. Add attributes like Color and Size to power your variations.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {form.attributes.map((a, i) => (
                      <div key={i} style={{ background: '#fcfaf7', border: '1px solid #e8e2db', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
                        <div style={{ background: '#f0ebe4', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '0.9rem', color: 'var(--maroon)' }}>{a.name || 'Attribute'}</strong>
                          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <span style={{ color: '#d93025', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '600' }} onClick={() => removeAttr(i)}>Remove</span>
                            <span style={{ color: '#6b665e', fontSize: '0.8rem' }}>☰</span>
                          </div>
                        </div>
                        <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '200px 1fr', gap: '32px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name:</label>
                              <input className="form-input" value={a.name} onChange={e => updateAttr(i, 'name', e.target.value)} placeholder="e.g. Color" />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type:</label>
                              <select className="form-input" value={a.type || 'text'} onChange={e => updateAttr(i, 'type', e.target.value)}>
                                <option value="text">Text</option>
                                <option value="color">Color</option>
                                <option value="image">Image</option>
                              </select>
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '8px' }}>
                              <input type="checkbox" checked={a.isVisible} onChange={e => { const aa = [...form.attributes]; aa[i].isVisible = e.target.checked; set('attributes', aa); }} />
                              <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Visible on the product page</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                              <input type="checkbox" checked={a.isVariation} onChange={e => { const aa = [...form.attributes]; aa[i].isVariation = e.target.checked; set('attributes', aa); }} />
                              <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Used for variations</span>
                            </label>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                              <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Value(s): {a.type !== 'text' && `(Configure ${a.type} swatches below)`}</label>
                              <div style={{ border: '1px solid #d8d0c5', borderRadius: 'var(--r-sm)', padding: '12px', minHeight: '80px', background: '#ffffff', transition: 'border-color 0.2s' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                                  {a.values?.map((v, idx) => (
                                    <span key={idx} style={{ background: '#f0ebe4', border: '1px solid #d8d0c5', borderRadius: '4px', padding: '4px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#1a1917', fontWeight: '500' }}>
                                      <span style={{ cursor: 'pointer', color: '#6b665e' }} onClick={() => {
                                        const newValues = a.values.filter((_, vIdx) => vIdx !== idx);
                                        const aa = [...form.attributes];
                                        aa[i] = { ...aa[i], values: newValues, value: newValues.length > 0 ? newValues.join(', ') : '' };
                                        set('attributes', aa);
                                      }}>×</span>
                                      {v}
                                    </span>
                                  ))}
                                </div>
                                <input className="form-input-ghost" style={{ width: '100%', border: 'none', background: 'transparent', color: '#1a1917', fontSize: '0.9rem', outline: 'none' }}
                                  placeholder="Add values... (separate by comma)"
                                  value={a.value || ''}
                                  onChange={e => {
                                    const val = e.target.value;
                                    const values = val.split(',').map(v => v.trim()).filter(v => v);
                                    const aa = [...form.attributes];
                                    aa[i] = { ...aa[i], value: val, values };
                                    set('attributes', aa);
                                  }} />
                              </div>
                            </div>

                            {(a.type === 'color' || a.type === 'image') && a.values?.length > 0 && (
                              <div style={{ background: 'var(--ink)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '16px' }}>
                                <h4 style={{ fontSize: '0.8rem', color: 'var(--gold)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{a.type} Swatches</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                                  {a.values.map(val => {
                                    const swatch = a.swatches?.find(s => s.value === val) || { value: val, color: '#000000', image: '' };
                                    return (
                                      <div key={val} style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'var(--ink-mid)', padding: '8px', borderRadius: '4px' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: '600' }}>{val}</span>
                                        {a.type === 'color' ? (
                                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <input type="color" value={swatch.color} style={{ width: '30px', height: '30px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                                              onChange={e => {
                                                const newSwatches = [...(a.swatches || [])];
                                                const sIdx = newSwatches.findIndex(s => s.value === val);
                                                if (sIdx > -1) newSwatches[sIdx].color = e.target.value;
                                                else newSwatches.push({ value: val, color: e.target.value });
                                                updateAttr(i, 'swatches', newSwatches);
                                              }} />
                                            <input className="form-input" style={{ fontSize: '0.7rem', height: '24px', padding: '0 6px' }} value={swatch.color} onChange={e => {
                                              const newSwatches = [...(a.swatches || [])];
                                              const sIdx = newSwatches.findIndex(s => s.value === val);
                                              if (sIdx > -1) newSwatches[sIdx].color = e.target.value;
                                              else newSwatches.push({ value: val, color: e.target.value });
                                              updateAttr(i, 'swatches', newSwatches);
                                            }} />
                                          </div>
                                        ) : (
                                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <div style={{ width: '30px', height: '30px', background: 'var(--ink)', border: '1px solid var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                                              {swatch.image ? <img src={swatch.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🖼️'}
                                            </div>
                                            <input className="form-input" style={{ fontSize: '0.7rem', height: '24px', padding: '0 6px' }} placeholder="Image URL..." value={swatch.image} onChange={e => {
                                              const newSwatches = [...(a.swatches || [])];
                                              const sIdx = newSwatches.findIndex(s => s.value === val);
                                              if (sIdx > -1) newSwatches[sIdx].image = e.target.value;
                                              else newSwatches.push({ value: val, image: e.target.value });
                                              updateAttr(i, 'swatches', newSwatches);
                                            }} />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            <div style={{ display: 'flex', gap: '10px' }}>
                              <button className="btn btn-outline btn-sm" style={{ fontSize: '0.75rem', borderRadius: '4px' }} onClick={() => {
                                if (!a.value) return;
                                const values = a.value.split(',').map(v => v.trim()).filter(v => v);
                                const aa = [...form.attributes];
                                aa[i] = { ...aa[i], values };
                                set('attributes', aa);
                              }}>Select all</button>
                              <button className="btn btn-outline btn-sm" style={{ fontSize: '0.75rem', borderRadius: '4px' }} onClick={() => {
                                const aa = [...form.attributes];
                                aa[i] = { ...aa[i], values: [], value: '' };
                                set('attributes', aa);
                              }}>Select none</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 6: SEO */}
            {activeSection === 6 && (
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '24px' }}>SEO Settings</h3>
                <div className="form-group">
                  <label className="form-label">Meta Title <span style={{ color: 'var(--muted)' }}>({(form.seo.title || '').length}/60)</span></label>
                  <input className="form-input" value={form.seo.title} onChange={e => set('seo', { ...form.seo, title: e.target.value })} placeholder="Versailles Silk Blouse | LuxeStore" maxLength={60} />
                </div>
                <div className="form-group">
                  <label className="form-label">Meta Description <span style={{ color: 'var(--muted)' }}>({(form.seo.description || '').length}/160)</span></label>
                  <textarea className="form-input" value={form.seo.description} onChange={e => set('seo', { ...form.seo, description: e.target.value })} rows={3} placeholder="Shop the Versailles Silk Blouse..." maxLength={160} style={{ resize: 'vertical' }} />
                </div>
                {/* Google Preview */}
                <div style={{ background: 'white', borderRadius: 'var(--r-md)', padding: '16px 20px', marginTop: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#1a0dab', marginBottom: '2px', fontFamily: 'Arial, sans-serif' }}>{form.seo.title || form.name || 'Product Title'} | LuxeStore</div>
                  <div style={{ fontSize: '0.7rem', color: '#006621', fontFamily: 'Arial, sans-serif', marginBottom: '4px' }}>luxestore.com › products › {form.slug || 'product-slug'}</div>
                  <div style={{ fontSize: '0.75rem', color: '#545454', fontFamily: 'Arial, sans-serif', lineHeight: '1.4' }}>{form.seo.description || form.shortDescription || 'No meta description set yet...'}</div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-ghost" disabled={activeSection === 0} onClick={() => setActiveSection(s => s - 1)}>← Previous</button>
              {activeSection < SECTIONS.length - 1 ? (
                <button className="btn btn-outline" onClick={() => setActiveSection(s => s + 1)}>Next →</button>
              ) : (
                <button className="btn btn-gold" onClick={handleSubmit} disabled={saving}>
                  {saving ? <><span className="spinner" /> Saving…</> : (id ? 'Update Product' : 'Publish Product')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
