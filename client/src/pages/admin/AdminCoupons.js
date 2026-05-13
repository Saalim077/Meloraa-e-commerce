import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { couponAPI } from '../../utils/api';

const defaultForm = { code: '', type: 'percentage', value: '', minPurchase: '', maxDiscount: '', usageLimit: '', startDate: '', endDate: '', isActive: true };

const fmtINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try { 
      const res = await couponAPI.getAll(); 
      setCoupons(res.data.coupons); 
    } catch { 
      setCoupons([]); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, code: form.code.toUpperCase() };
      if (editingId) {
        await couponAPI.update(editingId, payload);
        toast.success('Coupon updated!');
      } else {
        await couponAPI.create(payload);
        toast.success('Coupon created!');
      }
      setForm(defaultForm); 
      setShowForm(false); 
      setEditingId(null);
      load();
    } catch (err) { 
      toast.error(editingId ? 'Update failed' : 'Create failed'); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleEdit = (coupon) => {
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minPurchase: coupon.minPurchase || '',
      maxDiscount: coupon.maxDiscount || '',
      usageLimit: coupon.usageLimit || '',
      startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().split('T')[0] : '',
      endDate: coupon.endDate ? new Date(coupon.endDate).toISOString().split('T')[0] : '',
      isActive: coupon.isActive
    });
    setEditingId(coupon._id);
    setShowForm(true);
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Delete coupon "${code}"?`)) return;
    try { await couponAPI.remove(id); toast.success('Deleted'); load(); } catch { toast.error('Failed'); }
  };

  const isExpired = (d) => d && new Date(d) < new Date().setHours(0,0,0,0);

  return (
    <div>
      <div className="page-header">
        <h1>Coupons</h1>
        <p>Create and manage discount codes</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: showForm ? '1fr 420px' : '1fr', gap: '24px' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>{coupons.length} coupons</span>
            <button className="btn btn-gold" onClick={() => { setEditingId(null); setForm(defaultForm); setShowForm(true); }}>+ New Coupon</button>
          </div>

          {loading ? <div className="loading-center"><div className="spinner spinner-lg" /></div> :
            coupons.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">◇</div>
                <h3>No coupons yet</h3>
                <p>Create your first discount coupon</p>
                <button className="btn btn-gold" style={{ marginTop: '20px' }} onClick={() => setShowForm(true)}>Create Coupon</button>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr><th>Code</th><th>Type</th><th>Value</th><th>Min Purchase</th><th>Usage</th><th>Expiry</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {coupons.map(c => (
                      <tr key={c._id}>
                        <td>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', background: 'var(--gold-dim)', color: 'var(--gold)', padding: '3px 10px', borderRadius: '4px', border: '1px solid rgba(201,168,76,0.3)', letterSpacing: '0.05em' }}>
                            {c.code}
                          </span>
                        </td>
                        <td>
                          <span className={`chip ${c.type === 'percentage' ? 'chip-confirmed' : 'chip-processing'}`} style={{ textTransform: 'capitalize' }}>{c.type}</span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: 'var(--cream)' }}>
                          {c.type === 'percentage' ? `${c.value}%` : fmtINR(c.value)}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--muted)' }}>{fmtINR(c.minPurchase)}</td>
                        <td>
                          <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                            <span style={{ color: 'var(--cream)' }}>{c.usedCount}</span>
                            <span style={{ color: 'var(--muted)' }}>/{c.usageLimit || '∞'}</span>
                          </div>
                          {c.usageLimit > 0 && (
                            <div style={{ height: '3px', background: 'var(--border)', borderRadius: '2px', marginTop: '4px', width: '80px' }}>
                              <div style={{ height: '100%', background: c.usedCount >= c.usageLimit ? 'var(--red)' : 'var(--gold)', borderRadius: '2px', width: `${Math.min((c.usedCount / c.usageLimit) * 100, 100)}%` }} />
                            </div>
                          )}
                        </td>
                        <td style={{ fontSize: '0.78rem', color: isExpired(c.endDate) ? 'var(--red)' : 'var(--muted)' }}>
                          {c.endDate ? new Date(c.endDate).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td>
                          <span className={`chip ${!c.isActive || isExpired(c.endDate) ? 'chip-blocked' : 'chip-active'}`}>
                            {!c.isActive ? 'Inactive' : isExpired(c.endDate) ? 'Expired' : 'Active'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-gold btn-sm" onClick={() => handleEdit(c)}>Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c._id, c.code)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>

        {/* Create/Edit Form */}
        {showForm && (
          <div className="card" style={{ height: 'fit-content', position: 'sticky', top: '80px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', margin: 0, border: 'none' }}>{editingId ? 'Edit Coupon' : 'New Coupon'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowForm(false); setEditingId(null); }}>×</button>
            </div>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Coupon Code</label>
                  <input className="form-input" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="SUMMER20" required style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }} />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select className="form-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Value {form.type === 'percentage' ? '(%)' : '(₹)'}</label>
                    <input className="form-input" type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder={form.type === 'percentage' ? '20' : '500'} required style={{ fontFamily: 'var(--font-mono)' }} />
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Min Purchase (₹)</label>
                    <input className="form-input" type="number" value={form.minPurchase} onChange={e => setForm(f => ({ ...f, minPurchase: e.target.value }))} placeholder="1000" style={{ fontFamily: 'var(--font-mono)' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Discount (₹)</label>
                    <input className="form-input" type="number" value={form.maxDiscount} onChange={e => setForm(f => ({ ...f, maxDiscount: e.target.value }))} placeholder="5000" style={{ fontFamily: 'var(--font-mono)' }} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Usage Limit (0 = unlimited)</label>
                  <input className="form-input" type="number" value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))} placeholder="100" style={{ fontFamily: 'var(--font-mono)' }} />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input className="form-input" type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input className="form-input" type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                    <span className="form-label" style={{ marginBottom: 0 }}>Active</span>
                  </label>
                </div>
                <button type="submit" className="btn btn-gold btn-full" disabled={saving}>
                  {saving ? <><span className="spinner" /> Saving…</> : editingId ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </form>
          </div>
        )}
      </div>
    </div>
  );
}

