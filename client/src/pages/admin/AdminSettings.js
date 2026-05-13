import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { settingsAPI } from '../../utils/api';

export default function AdminSettings() {
  const { user } = useSelector(s => s.auth);
  const isAdmin = user?.role === 'admin';
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('general');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await settingsAPI.getSettings();
      setSettings(res.data);
    } catch (err) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsAPI.updateSettings(settings);
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const addTaxClass = () => {
    setSettings(prev => ({
      ...prev,
      taxClasses: [...(prev.taxClasses || []), { name: '', rate: 0 }]
    }));
  };

  const removeTaxClass = (index) => {
    setSettings(prev => ({
      ...prev,
      taxClasses: (prev.taxClasses || []).filter((_, i) => i !== index)
    }));
  };

  const handleTaxClassChange = (index, field, value) => {
    setSettings(prev => {
      const newClasses = [...(prev.taxClasses || [])];
      newClasses[index] = { ...newClasses[index], [field]: value };
      return { ...prev, taxClasses: newClasses };
    });
  };

  const addCommonAttribute = () => {
    setSettings(prev => ({
      ...prev,
      commonAttributes: [...(prev.commonAttributes || []), { name: '', type: 'text', values: [], swatches: [] }]
    }));
  };

  const removeCommonAttribute = (index) => {
    setSettings(prev => ({
      ...prev,
      commonAttributes: (prev.commonAttributes || []).filter((_, i) => i !== index)
    }));
  };

  const handleAttrChange = (index, field, value) => {
    setSettings(prev => {
      const attrs = [...(prev.commonAttributes || [])];
      attrs[index] = { ...attrs[index], [field]: value };
      return { ...prev, commonAttributes: attrs };
    });
  };

  const handleAttrValuesChange = (index, valueString) => {
    const values = valueString.split(',').map(v => v.trim()).filter(v => v);
    setSettings(prev => {
      const attrs = [...(prev.commonAttributes || [])];
      attrs[index] = { ...attrs[index], values, valueString }; // Keep raw string for input
      return { ...prev, commonAttributes: attrs };
    });
  };

  const updateSwatch = (attrIdx, val, field, value) => {
    setSettings(prev => {
      const attrs = [...(prev.commonAttributes || [])];
      const swatches = [...(attrs[attrIdx].swatches || [])];
      const sIdx = swatches.findIndex(s => s.value === val);
      if (sIdx > -1) {
        swatches[sIdx] = { ...swatches[sIdx], [field]: value };
      } else {
        swatches.push({ value: val, [field]: value });
      }
      attrs[attrIdx] = { ...attrs[attrIdx], swatches };
      return { ...prev, commonAttributes: attrs };
    });
  };

  const addShopFilter = (type, label, id) => {
    setSettings(prev => ({
      ...prev,
      shopFilters: [...(prev.shopFilters || []), { id, label, type, active: true, order: (prev.shopFilters?.length || 0) }]
    }));
  };

  const removeShopFilter = (index) => {
    setSettings(prev => ({
      ...prev,
      shopFilters: (prev.shopFilters || []).filter((_, i) => i !== index)
    }));
  };

  const handleFilterChange = (index, field, value) => {
    setSettings(prev => {
      const filters = [...(prev.shopFilters || [])];
      filters[index] = { ...filters[index], [field]: value };
      return { ...prev, shopFilters: filters };
    });
  };

  const moveFilter = (index, direction) => {
    setSettings(prev => {
      const filters = [...(prev.shopFilters || [])];
      const newIdx = index + direction;
      if (newIdx < 0 || newIdx >= filters.length) return prev;
      [filters[index], filters[newIdx]] = [filters[newIdx], filters[index]];
      return { ...prev, shopFilters: filters };
    });
  };

  if (loading) return <div className="loading-center"><div className="spinner spinner-lg" /></div>;
  if (!settings) return <div className="error">Failed to load settings</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Settings</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <p>Configure your store</p>
          {!isAdmin && <span className="chip chip-warning" style={{ fontSize: '0.7rem' }}>View Only Mode</span>}
        </div>
      </div>

      <div className="tabs-wrapper">
        <div className="tabs">
          {['general', 'email', 'stripe', 'shipping', 'tax', 'attributes', 'filters', 'rma'].map(t => (
            <button
              key={t}
              className={`tab ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'filters' ? 'Shop Filters' : t === 'rma' ? 'RMA Policies' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        {tab === 'general' && (
          <div>
            <h3>General Settings</h3>
            <div className="form-group">
              <label>Store Name</label>
              <input
                className="form-input"
                type="text"
                name="storeName"
                value={settings.storeName || ''}
                onChange={handleInputChange}
                readOnly={!isAdmin}
              />
            </div>
            <div className="form-group">
              <label>Store Email</label>
              <input
                className="form-input"
                type="email"
                name="email"
                value={settings.email || ''}
                onChange={handleInputChange}
                readOnly={!isAdmin}
              />
            </div>
            <div className="form-group">
              <label>Store Phone</label>
              <input
                className="form-input"
                type="tel"
                name="phone"
                value={settings.phone || ''}
                onChange={handleInputChange}
                readOnly={!isAdmin}
              />
            </div>
            <div className="form-group">
              <label>Store Description</label>
              <textarea
                className="form-input"
                name="storeDescription"
                value={settings.storeDescription || ''}
                onChange={handleInputChange}
                rows="4"
                readOnly={!isAdmin}
              />
            </div>
            <div className="form-group">
              <label>Currency</label>
              <input
                className="form-input"
                type="text"
                name="currencyCode"
                value={settings.currencyCode || ''}
                onChange={handleInputChange}
                placeholder="INR"
                readOnly={!isAdmin}
              />
            </div>
            <div className="form-group">
              <label>Timezone</label>
              <select className="form-input" name="timezone" value={settings.timezone || ''} onChange={handleInputChange} disabled={!isAdmin}>
                <option value="Asia/Kolkata">Asia/Kolkata</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
              </select>
            </div>
          </div>
        )}

        {tab === 'email' && (
          <div>
            <h3>Email Settings</h3>
            <div className="form-group">
              <label>Email Provider</label>
              <select className="form-input" name="emailProvider" value={settings.emailProvider || 'smtp'} onChange={handleInputChange} disabled={!isAdmin}>
                <option value="smtp">SMTP</option>
                <option value="sendgrid">SendGrid</option>
              </select>
            </div>
            <div className="form-group">
              <label>SMTP Host</label>
              <input
                className="form-input"
                type="text"
                name="smtpHost"
                value={settings.smtpHost || ''}
                onChange={handleInputChange}
                placeholder="smtp.gmail.com"
                readOnly={!isAdmin}
              />
            </div>
            <div className="form-group">
              <label>SMTP Port</label>
              <input
                className="form-input"
                type="number"
                name="smtpPort"
                value={settings.smtpPort || 587}
                onChange={handleInputChange}
                readOnly={!isAdmin}
              />
            </div>
            <div className="form-group">
              <label>SMTP User</label>
              <input
                className="form-input"
                type="email"
                name="smtpUser"
                value={settings.smtpUser || ''}
                onChange={handleInputChange}
                readOnly={!isAdmin}
              />
            </div>
            <div className="form-group">
              <label>SMTP Password</label>
              <input
                className="form-input"
                type="password"
                name="smtpPassword"
                value={settings.smtpPassword || ''}
                onChange={handleInputChange}
                readOnly={!isAdmin}
              />
            </div>
          </div>
        )}

        {tab === 'stripe' && (
          <div>
            <h3>Stripe Configuration</h3>
            <div className="form-group">
              <label>Stripe Public Key</label>
              <input
                className="form-input"
                type="text"
                name="stripePublicKey"
                value={settings.stripePublicKey || ''}
                onChange={handleInputChange}
                readOnly={!isAdmin}
              />
            </div>
            <div className="form-group">
              <label>Stripe Secret Key</label>
              <input
                className="form-input"
                type="password"
                name="stripeSecretKey"
                value={settings.stripeSecretKey || ''}
                onChange={handleInputChange}
                readOnly={!isAdmin}
              />
            </div>
          </div>
        )}

        {tab === 'shipping' && (
          <div>
            <h3>Shipping Settings</h3>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="shippingEnabled"
                  checked={settings.shippingEnabled || false}
                  onChange={handleInputChange}
                  disabled={!isAdmin}
                />
                Enable Shipping
              </label>
            </div>
            {settings.shippingEnabled && (
              <>
                <div className="form-group">
                  <label>Standard Shipping Cost (₹)</label>
                  <input
                    className="form-input"
                    type="number"
                    name="standardShippingCost"
                    value={settings.standardShippingCost || 0}
                    onChange={handleInputChange}
                    readOnly={!isAdmin}
                  />
                </div>
                <div className="form-group">
                  <label>Free Shipping Threshold (₹)</label>
                  <input
                    className="form-input"
                    type="number"
                    name="freeShippingThreshold"
                    value={settings.freeShippingThreshold || 0}
                    onChange={handleInputChange}
                    readOnly={!isAdmin}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'tax' && (
          <div>
            <h3>Tax Settings</h3>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="taxEnabled"
                  checked={settings.taxEnabled || false}
                  onChange={handleInputChange}
                  disabled={!isAdmin}
                />
                Enable Tax Calculation
              </label>
            </div>
            {settings.taxEnabled && (
              <>
                <div className="form-group">
                  <label>Default Tax Rate (%)</label>
                  <input
                    className="form-input"
                    type="number"
                    name="taxRate"
                    value={settings.taxRate || 0}
                    onChange={handleInputChange}
                    step="0.1"
                    readOnly={!isAdmin}
                  />
                  <small style={{ color: 'var(--muted)', marginTop: '4px', display: 'block' }}>Applied if no specific product tax class is matched</small>
                </div>
                <div className="form-group">
                  <label>Tax Label</label>
                  <input
                    className="form-input"
                    type="text"
                    name="taxLabel"
                    value={settings.taxLabel || 'GST'}
                    onChange={handleInputChange}
                    readOnly={!isAdmin}
                  />
                </div>

                <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <h4>Product Tax Classes</h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '16px' }}>Define specific tax rates (e.g., 5% Apparel, 18% Electronics) that you can assign to individual products.</p>

                  {(settings.taxClasses || []).map((tc, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                      <input
                        className="form-input"
                        type="text"
                        placeholder="Class Name (e.g. Standard)"
                        value={tc.name}
                        onChange={e => handleTaxClassChange(idx, 'name', e.target.value)}
                        style={{ flex: 1 }}
                        readOnly={!isAdmin}
                      />
                      <input
                        className="form-input"
                        type="number"
                        placeholder="Rate %"
                        value={tc.rate}
                        onChange={e => handleTaxClassChange(idx, 'rate', Number(e.target.value))}
                        style={{ width: '100px' }}
                        step="0.1"
                        readOnly={!isAdmin}
                      />
                      <button className="btn btn-danger btn-sm" onClick={() => removeTaxClass(idx)} disabled={!isAdmin}>Remove</button>
                    </div>
                  ))}
                  <button className="btn btn-outline btn-sm" onClick={addTaxClass} disabled={!isAdmin}>+ Add Tax Class</button>
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'attributes' && (
          <div>
            <h3>Global Product Attributes</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '24px' }}>
              Define common attributes (like Size, Color, Material) that can be easily added to any product.
            </p>

            {(settings.commonAttributes || []).map((attr, aIdx) => (
              <div key={aIdx} className="card" style={{ background: '#f9f6f2', border: '1px solid #e8e2db', marginBottom: '20px', overflow: 'hidden', padding: 0 }}>
                <div style={{ background: '#eee8e0', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--maroon)' }}>{attr.name || 'New Attribute'}</strong>
                  <button className="btn btn-danger btn-sm" onClick={() => removeCommonAttribute(aIdx)} disabled={!isAdmin}>Remove</button>
                </div>
                <div style={{ padding: '20px' }}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Attribute Name</label>
                      <input className="form-input" type="text" value={attr.name} onChange={e => handleAttrChange(aIdx, 'name', e.target.value)} placeholder="e.g. Color" readOnly={!isAdmin} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Type</label>
                      <select className="form-input" value={attr.type} onChange={e => handleAttrChange(aIdx, 'type', e.target.value)} disabled={!isAdmin}>
                        <option value="text">Text</option>
                        <option value="color">Color</option>
                        <option value="image">Image</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Values (comma separated)</label>
                    <input className="form-input" type="text" value={attr.valueString || attr.values.join(', ')} onChange={e => handleAttrValuesChange(aIdx, e.target.value)} placeholder="Red, Blue, Green" readOnly={!isAdmin} />
                  </div>

                  {(attr.type === 'color' || attr.type === 'image') && attr.values?.length > 0 && (
                    <div style={{ marginTop: '16px', padding: '16px', background: '#fcfaf7', borderRadius: 'var(--r-sm)', border: '1px solid #e8e2db' }}>
                      <h4 style={{ fontSize: '0.8rem', color: 'var(--maroon)', marginBottom: '12px', textTransform: 'uppercase' }}>{attr.type} Swatches</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                        {attr.values.map(val => {
                          const swatch = attr.swatches?.find(s => s.value === val) || { value: val, color: '#000000', image: '' };
                          return (
                            <div key={val} style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: '#fcfaf7', padding: '8px', borderRadius: '4px', border: '1px solid #eee' }}>
                              <span style={{ fontSize: '0.75rem', color: '#666' }}>{val}</span>
                              {attr.type === 'color' ? (
                                <input type="color" value={swatch.color} onChange={e => updateSwatch(aIdx, val, 'color', e.target.value)} style={{ width: '100%', height: '30px', border: 'none', background: 'transparent', cursor: 'pointer' }} disabled={!isAdmin} />
                              ) : (
                                <input className="form-input" style={{ fontSize: '0.7rem', height: '24px' }} placeholder="Image URL..." value={swatch.image} onChange={e => updateSwatch(aIdx, val, 'image', e.target.value)} readOnly={!isAdmin} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <button className="btn btn-outline" onClick={addCommonAttribute}>+ Add New Global Attribute</button>
          </div>
        )}

        {tab === 'filters' && (
          <div>
            <h3>Shop Filters Configuration</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '24px' }}>
              Control which filters appear on your Shop page and in what order.
            </p>

            <div className="table-wrap" style={{ marginBottom: '20px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Label</th>
                    <th>Type</th>
                    <th>Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(settings.shopFilters || []).map((filter, idx) => (
                    <tr key={idx}>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => moveFilter(idx, -1)} disabled={idx === 0}>↑</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => moveFilter(idx, 1)} disabled={idx === (settings.shopFilters.length - 1)}>↓</button>
                        </div>
                      </td>
                      <td>
                        <input
                          type="text"
                          value={filter.label}
                          onChange={e => handleFilterChange(idx, 'label', e.target.value)}
                          className="form-input"
                          style={{ margin: 0 }}
                        />
                      </td>
                      <td>
                        <span className="chip" style={{ textTransform: 'capitalize' }}>{filter.type}</span>
                        {filter.type === 'attribute' && <span style={{ marginLeft: '8px', opacity: 0.6 }}>({filter.id.replace('attr_', '')})</span>}
                      </td>
                      <td>
                        <label className="toggle">
                          <input
                            type="checkbox"
                            checked={filter.active}
                            onChange={e => handleFilterChange(idx, 'active', e.target.checked)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </td>
                      <td>
                        <button className="btn btn-danger btn-sm" onClick={() => removeShopFilter(idx)}>Remove</button>
                      </td>
                    </tr>
                  ))}
                  {(settings.shopFilters || []).length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px' }}>
                        No filters configured. Add filters below.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ background: '#f9f6f2', padding: '20px', borderRadius: 'var(--r-md)', border: '1px solid #e8e2db' }}>
              <h4 style={{ marginBottom: '16px', fontSize: '1rem' }}>Add New Filter</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <button className="btn btn-outline btn-sm" onClick={() => addShopFilter('category', 'Filter by Categories', 'category')}>Category</button>
                <button className="btn btn-outline btn-sm" onClick={() => addShopFilter('subCategory', 'Filter by SubCategories', 'subCategory')}>SubCategory</button>
                <button className="btn btn-outline btn-sm" onClick={() => addShopFilter('brand', 'Filter by Brand', 'brand')}>Brand</button>
                <button className="btn btn-outline btn-sm" onClick={() => addShopFilter('price', 'Filter by Prices', 'price')}>Price Range</button>
                <button className="btn btn-outline btn-sm" onClick={() => addShopFilter('sale', 'Filter by Sale', 'sale')}>On Sale</button>
                <button className="btn btn-outline btn-sm" onClick={() => addShopFilter('rating', 'Filter by rating', 'rating')}>Rating</button>

                <div style={{ width: '100%', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '8px' }}>Add Attribute Filter:</p>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {(settings.commonAttributes || []).map(attr => {
                      const id = `attr_${attr.name}`;
                      const exists = (settings.shopFilters || []).some(f => f.id === id);
                      return (
                        <button
                          key={attr.name}
                          className="btn btn-ghost btn-sm"
                          onClick={() => addShopFilter('attribute', `Filter by ${attr.name}`, id)}
                          disabled={exists}
                          style={{ border: '1px dashed var(--border)' }}
                        >
                          {exists ? `✓ ${attr.name}` : `+ ${attr.name}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'rma' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3>RMA Policies</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
                  Define rules for Returns, Refunds, Cancellations, and Exchanges.
                </p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => {
                setSettings(prev => ({
                  ...prev,
                  rmaPolicies: [...(prev.rmaPolicies || []), { type: 'return', paymentMethod: 'all', condition: 'InCase: If', parameter: 'Maximum Days', operator: 'Less than', value: 7, active: true }]
                }));
              }}>
                ADD MORE
              </button>
            </div>

            <div className="rma-rules-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {(settings.rmaPolicies || []).map((policy, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#fcfaf7', padding: '16px', borderRadius: 'var(--r-md)', border: '1px solid #e8e2db' }}>
                  <select
                    className="form-input"
                    value={policy.type}
                    style={{ width: '120px', margin: 0 }}
                    onChange={e => {
                      const newPolicies = settings.rmaPolicies.map((p, i) =>
                        i === idx ? { ...p, type: e.target.value } : p
                      );
                      setSettings({ ...settings, rmaPolicies: newPolicies });
                    }}
                  >
                    <option value="return">Return</option>
                    <option value="refund">Refund</option>
                    <option value="exchange">Exchange</option>
                    <option value="cancel">Cancel</option>
                  </select>

                  <select
                    className="form-input"
                    value={policy.condition}
                    onChange={() => { }}
                    style={{ width: '110px', margin: 0, opacity: 0.8 }}
                    disabled={!isAdmin}
                  >
                    <option value="InCase: If">InCase: If</option>
                  </select>

                  <select
                    className="form-input"
                    value={policy.paymentMethod || 'all'}
                    onChange={e => {
                      const newPolicies = settings.rmaPolicies.map((p, i) =>
                        i === idx ? { ...p, paymentMethod: e.target.value } : p
                      );
                      setSettings({ ...settings, rmaPolicies: newPolicies });
                    }}
                    style={{ width: '140px', margin: 0 }}
                  >
                    <option value="all">Any Method</option>
                    <option value="cod">COD</option>
                    <option value="online">Online Payment (Paid)</option>
                  </select>

                  <select
                    className="form-input"
                    value={policy.parameter}
                    style={{ width: '160px', margin: 0 }}
                    onChange={e => {
                      const newPolicies = settings.rmaPolicies.map((p, i) =>
                        i === idx ? { ...p, parameter: e.target.value, value: e.target.value === 'Maximum Days' ? 7 : 'delivered' } : p
                      );
                      setSettings({ ...settings, rmaPolicies: newPolicies });
                    }}
                  >
                    <option value="Maximum Days">Maximum Days</option>
                    <option value="Order Statuses">Order Statuses</option>
                  </select>

                  <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>is</span>

                  <select
                    className="form-input"
                    value={policy.operator}
                    style={{ width: '140px', margin: 0 }}
                    onChange={e => {
                      const newPolicies = settings.rmaPolicies.map((p, i) =>
                        i === idx ? { ...p, operator: e.target.value } : p
                      );
                      setSettings({ ...settings, rmaPolicies: newPolicies });
                    }}
                  >
                    <option value="Less than">Less than</option>
                    <option value="Greater than">Greater than</option>
                    <option value="Equal to">Equal to</option>
                    <option value="Not equal to">Not equal to</option>
                  </select>
                  <div style={{ flex: 1 }}>
                    {policy.parameter === 'Maximum Days' ? (
                      <input
                        className="form-input"
                        type="number"
                        value={policy.value}
                        onChange={e => {
                          const newPolicies = settings.rmaPolicies.map((p, i) =>
                            i === idx ? { ...p, value: Number(e.target.value) } : p
                          );
                          setSettings({ ...settings, rmaPolicies: newPolicies });
                        }}
                        style={{ margin: 0 }}
                        readOnly={!isAdmin}
                      />
                    ) : (
                      <select
                        className="form-input"
                        value={Array.isArray(policy.value) ? policy.value[0] : policy.value}
                        onChange={e => {
                          const newPolicies = settings.rmaPolicies.map((p, i) =>
                            i === idx ? { ...p, value: e.target.value } : p
                          );
                          setSettings({ ...settings, rmaPolicies: newPolicies });
                        }}
                        style={{ margin: 0 }}
                        disabled={!isAdmin}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="refunded">Refunded</option>
                        <option value="Refund Requested">Refund Requested</option>
                      </select>
                    )}
                  </div>

                  <button
                    className="btn btn-ghost"
                    style={{ color: 'var(--red)', minWidth: '40px' }}
                    onClick={() => {
                      const newPolicies = settings.rmaPolicies.filter((_, i) => i !== idx);
                      setSettings({ ...settings, rmaPolicies: newPolicies });
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}

              {(settings.rmaPolicies || []).length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', background: '#f9f6f2', borderRadius: 'var(--r-md)', border: '2px dashed #e8e2db', color: '#6b665e' }}>
                  No RMA policies defined. Click "ADD MORE" to create a new rule.
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || !isAdmin}
            title={!isAdmin ? 'Only administrators can save changes' : ''}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button className="btn btn-secondary" onClick={loadSettings}>
            Reset
          </button>
          {!isAdmin && (
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)', fontStyle: 'italic' }}>
              * You have read-only access to settings.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
