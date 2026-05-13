import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { categoryAPI, uploadAPI } from '../../utils/api';

const EMOJIS = ['👗', '👜', '✨', '💎', '👠', '🏡', '🕶️', '⌚', '🧣', '💄', '🧴', '🎁'];

const defaultForm = { name: '', slug: '', description: '', image: '📦', order: 0, isActive: true, parent: '', sizeChart: '' };

const buildHierarchy = (items) => {
  const map = {};
  items.forEach(item => map[item._id] = { ...item, children: [] });
  const roots = [];
  items.forEach(item => {
    if (item.parent && map[item.parent]) {
      map[item.parent].children.push(map[item._id]);
    } else {
      roots.push(map[item._id]);
    }
  });
  return roots;
};

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [hierarchicalCategories, setHierarchicalCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(defaultForm);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await categoryAPI.getAll({ all: true });
      const cats = res.data.categories || [];
      setCategories(cats);
      setHierarchicalCategories(buildHierarchy(cats));
    } catch { 
      toast.error('Failed to load categories');
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { load(); }, []);

  const autoSlug = (n) => n.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('images', file);

    try {
      const res = await uploadAPI.upload(formData);
      const url = res.data.urls ? res.data.urls[0] : res.data.url;
      setForm(f => ({ ...f, sizeChart: url }));
      toast.success('Size chart uploaded!');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...form, level: form.parent ? (categories.find(c => c._id === form.parent)?.level || 0) + 1 : 0 };
      if (editing) {
        await categoryAPI.update(editing, data);
        toast.success('Category updated!');
      } else {
        await categoryAPI.create(data);
        toast.success('Category created!');
      }
      setForm(defaultForm); setEditing(null); setShowForm(false); load();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"?`)) return;
    try { await categoryAPI.remove(id); toast.success('Deleted'); load(); } catch { toast.error('Delete failed'); }
  };

  const handleEdit = (cat) => {
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      image: cat.image || '📦',
      order: cat.order || 0,
      isActive: cat.isActive,
      parent: cat.parent || '',
      sizeChart: cat.sizeChart || ''
    });
    setEditing(cat._id);
    setShowForm(true);
  };

  const handleToggleActive = async (cat) => {
    try {
      await categoryAPI.update(cat._id, { ...cat, isActive: !cat.isActive });
      setCategories(prev => prev.map(c => c._id === cat._id ? { ...c, isActive: !c.isActive } : c));
    } catch { toast.error('Update failed'); }
  };

  const renderRows = (items, depth = 0) => {
    return items.map(cat => (
      <React.Fragment key={cat._id}>
        <tr>
          <td>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: `${depth * 24}px` }}>
              {depth > 0 && <span style={{ color: 'var(--muted)' }}>└─</span>}
              <span style={{ fontSize: '1.3rem' }}>{cat.image}</span>
              <div>
                <div style={{ fontWeight: depth === 0 ? '600' : '500' }}>{cat.name}</div>
                {cat.sizeChart && <span style={{ fontSize: '0.7rem', color: 'var(--gold)', fontWeight: '700' }}>✓ Size Chart Attached</span>}
              </div>
            </div>
          </td>
          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--muted)' }}>{cat.slug}</td>
          <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>{cat.order}</td>
          <td>
            <label className="toggle">
              <input type="checkbox" checked={cat.isActive} onChange={() => handleToggleActive(cat)} />
              <span className="toggle-slider" />
            </label>
          </td>
          <td>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="btn btn-outline btn-sm" onClick={() => handleEdit(cat)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(cat._id, cat.name)}>Delete</button>
            </div>
          </td>
        </tr>
        {cat.children?.length > 0 && renderRows(cat.children, depth + 1)}
      </React.Fragment>
    ));
  };

  return (
    <div>
      <div className="page-header">
        <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--maroon)' }}>Category Architecture</h1>
        <p>Define your collections and attach exclusive sizing guides</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: showForm ? '1fr 450px' : '1fr', gap: '24px' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ color: '#888', fontSize: '0.9rem' }}>{categories.length} segments managed</span>
            <button className="btn btn-gold" onClick={() => { setForm(defaultForm); setEditing(null); setShowForm(true); }}>+ Add New Segment</button>
          </div>

          <div className="table-wrap" style={{ background: 'white', borderRadius: '12px', border: '1px solid #eee' }}>
            <table className="data-table">
              <thead style={{ background: '#fcfaf8' }}>
                <tr>
                  <th style={{ padding: '20px' }}>Collection / Segment</th>
                  <th>Slug</th>
                  <th>Order</th>
                  <th>Live</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center' }}><span className="spinner" /> Loading catalogue…</td></tr>
                ) : (
                  renderRows(hierarchicalCategories)
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showForm && (
          <div className="card" style={{ height: 'fit-content', position: 'sticky', top: '80px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <div className="card-body" style={{ padding: '30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--maroon)' }}>{editing ? 'Refine Segment' : 'New Segment'}</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => { setShowForm(false); setEditing(null); setForm(defaultForm); }} style={{ fontSize: '1.5rem' }}>×</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input className="form-input" value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value, slug: autoSlug(e.target.value) })); }} placeholder="e.g. Silk Sarees" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Parent Collection</label>
                  <select className="form-input" value={form.parent} onChange={e => setForm(f => ({ ...f, parent: e.target.value }))}>
                    <option value="">None (Top Level)</option>
                    {categories.filter(c => c._id !== editing).map(c => (
                      <option key={c._id} value={c._id}>
                        {'- '.repeat(c.level || 0)}{c.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* SIZE CHART SECTION */}
                <div className="form-group" style={{ background: '#fcfaf8', padding: '16px', borderRadius: '12px', border: '1px dashed var(--gold)' }}>
                  <label className="form-label" style={{ color: 'var(--maroon)', fontWeight: '700' }}>📏 Sizing Guide (Size Chart)</label>
                  <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: '12px' }}>Upload an image for the size chart specific to this subcategory.</p>
                  
                  {form.sizeChart ? (
                    <div style={{ position: 'relative', marginBottom: '12px' }}>
                      <img src={form.sizeChart} alt="Size Chart" style={{ width: '100%', height: '120px', objectFit: 'contain', background: 'white', borderRadius: '8px', border: '1px solid #eee' }} />
                      <button type="button" onClick={() => setForm(f => ({ ...f, sizeChart: '' }))} 
                        style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(217, 48, 37, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' }}>×</button>
                    </div>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <input type="file" accept="image/*" onChange={handleFileUpload} style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 2 }} />
                      <div style={{ border: '2px dashed #ddd', padding: '20px', textAlign: 'center', borderRadius: '8px', background: 'white' }}>
                        {uploading ? <><span className="spinner" /> Uploading…</> : 'Click to upload Size Chart image'}
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} style={{ resize: 'none' }} />
                </div>

                <div className="form-group">
                  <label className="form-label">Icon / Emoji Identifier</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                    {EMOJIS.map(e => (
                      <button type="button" key={e} onClick={() => setForm(f => ({ ...f, image: e }))}
                        style={{ width: '36px', height: '36px', borderRadius: '6px', border: form.image === e ? '2px solid var(--gold)' : '1px solid var(--border)', background: form.image === e ? 'var(--gold-dim)' : 'white', cursor: 'pointer', fontSize: '1.1rem' }}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Display Priority</label>
                    <input className="form-input" type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: e.target.value }))} style={{ fontFamily: 'var(--font-mono)' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Active</label>
                    <label className="toggle" style={{ marginTop: '12px', display: 'block' }}>
                      <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                </div>
                <button type="submit" className="btn btn-gold btn-full" disabled={saving} style={{ height: '48px', marginTop: '10px' }}>
                  {saving ? <><span className="spinner" /> Preserving…</> : (editing ? 'Update Segment' : 'Create Segment')}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
