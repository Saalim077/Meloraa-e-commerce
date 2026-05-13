import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { categoryAPI } from '../../utils/api';

const EMOJIS = ['👗', '👜', '✨', '💎', '👠', '🏡', '🕶️', '⌚', '🧣', '💄', '🧴', '🎁'];

const MOCK_CATS = [
  { _id: '1', name: 'Apparel', slug: 'apparel', image: '👗', order: 1, isActive: true, parent: null },
  { _id: '2', name: 'Accessories', slug: 'accessories', image: '👜', order: 2, isActive: true, parent: null },
];

const defaultForm = { name: '', slug: '', description: '', image: '📦', order: 0, isActive: true, parent: '' };

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

  const load = async () => {
    setLoading(true);
    try {
      const res = await categoryAPI.getAll({ all: true });
      const cats = res.data.categories || [];
      setCategories(cats);
      setHierarchicalCategories(buildHierarchy(cats));
    } catch { setCategories(MOCK_CATS); setHierarchicalCategories(buildHierarchy(MOCK_CATS)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const autoSlug = (n) => n.toLowerCase().replace(/[^a-z0-9]+/g, '-');

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
      parent: cat.parent || ''
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
              <span style={{ fontWeight: depth === 0 ? '600' : '500' }}>{cat.name}</span>
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
        <h1>Categories</h1>
        <p>Organize your product catalogue with multiple subcategories</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: showForm ? '1fr 400px' : '1fr', gap: '24px' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>{categories.length} categories total</span>
            <button className="btn btn-gold" onClick={() => { setForm(defaultForm); setEditing(null); setShowForm(true); }}>+ New Category</button>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Category</th><th>Slug</th><th>Order</th><th>Active</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {renderRows(hierarchicalCategories)}
              </tbody>
            </table>
          </div>
        </div>

        {showForm && (
          <div className="card" style={{ height: 'fit-content', position: 'sticky', top: '80px' }}>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>{editing ? 'Edit Category' : 'New Category'}</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => { setShowForm(false); setEditing(null); setForm(defaultForm); }}>×</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input className="form-input" value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value, slug: autoSlug(e.target.value) })); }} placeholder="Apparel" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Parent Category</label>
                  <select className="form-input" value={form.parent} onChange={e => setForm(f => ({ ...f, parent: e.target.value }))}>
                    <option value="">None (Top Level)</option>
                    {categories.filter(c => c._id !== editing).map(c => (
                      <option key={c._id} value={c._id}>
                        {'- '.repeat(c.level || 0)}{c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Slug</label>
                  <input className="form-input" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} style={{ fontFamily: 'var(--font-mono)' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ resize: 'none' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Icon / Emoji</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                    {EMOJIS.map(e => (
                      <button type="button" key={e} onClick={() => setForm(f => ({ ...f, image: e }))}
                        style={{ width: '36px', height: '36px', borderRadius: '6px', border: form.image === e ? '2px solid var(--gold)' : '1px solid var(--border)', background: form.image === e ? 'var(--gold-dim)' : 'var(--ink-mid)', cursor: 'pointer', fontSize: '1.1rem' }}>
                        {e}
                      </button>
                    ))}
                  </div>
                  <input className="form-input" value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} placeholder="emoji or image URL" />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Display Order</label>
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
                <button type="submit" className="btn btn-gold btn-full" disabled={saving}>
                  {saving ? <><span className="spinner" /> Saving…</> : (editing ? 'Update Category' : 'Create Category')}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
