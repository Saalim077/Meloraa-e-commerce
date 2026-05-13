import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { productAPI, categoryAPI, bulkAPI } from '../../utils/api';

const fmtINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const stockColor = (s) => s === 0 ? 'stock-out' : s <= 5 ? 'stock-low' : 'stock-ok';
const stockLabel = (s) => s === 0 ? 'Out of stock' : s <= 5 ? `Low (${s})` : s;

export default function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(null); // 'price', 'stock', 'status'
  const [bulkVal, setBulkVal] = useState({ amount: 0, type: 'percentage', stock: 0, stockType: 'add', status: true });
  const [bulkLoading, setBulkLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productAPI.getAll({ search, page, limit: 15 });
      setProducts(res.data.products);
      setPagination(res.data.pagination);
    } catch {
      // Use mock data if API unavailable
      setProducts(MOCK_PRODUCTS);
    } finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await productAPI.remove(id);
      toast.success('Product deleted');
      load();
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(null); }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(products.map(p => p._id));
    else setSelectedIds([]);
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkAction = async (action) => {
    if (action === 'delete') {
      if (!window.confirm(`Delete ${selectedIds.length} products?`)) return;
      setBulkLoading(true);
      try {
        await bulkAPI.deleteProducts({ productIds: selectedIds });
        toast.success('Products deleted');
        setSelectedIds([]);
        load();
      } catch (err) { toast.error(err.response?.data?.message || 'Bulk delete failed'); }
      finally { setBulkLoading(false); }
      return;
    }
    setShowBulkModal(action);
  };

  const submitBulkUpdate = async () => {
    setBulkLoading(true);
    try {
      if (showBulkModal === 'price') {
        await bulkAPI.updatePrices({ productIds: selectedIds, priceAdjustment: bulkVal.amount, adjustmentType: bulkVal.type });
      } else if (showBulkModal === 'stock') {
        await bulkAPI.updateStock({ productIds: selectedIds, stock: bulkVal.stock, adjustmentType: bulkVal.stockType });
      } else if (showBulkModal === 'status') {
        await bulkAPI.updateStatus({ productIds: selectedIds, isActive: bulkVal.status });
      }
      toast.success('Bulk update successful');
      setShowBulkModal(null);
      setSelectedIds([]);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Bulk update failed'); }
    finally { setBulkLoading(false); }
  };

  const handleExport = async () => {
    try {
      const res = await bulkAPI.exportProducts();
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products.csv';
      a.click();
    } catch { toast.error('Export failed'); }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      setBulkLoading(true);
      try {
        await bulkAPI.importProducts({ csvData: event.target.result });
        toast.success('Products imported successfully');
        load();
      } catch (err) { toast.error(err.response?.data?.message || 'Import failed'); }
      finally { setBulkLoading(false); e.target.value = ''; }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Products</h1>
        <p>Manage your product catalogue</p>
      </div>

      {/* Toolbar */}
      <div className="admin-filters" style={{ marginBottom: '32px' }}>
        <div className="search-bar" style={{ flex: 1, maxWidth: '400px' }}>
          <span>⌕</span>
          <input placeholder="Search products..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" onClick={handleExport} style={{ height: '44px', padding: '0 20px' }}>
            Export CSV
          </button>
          <label className="btn btn-outline" style={{ cursor: 'pointer', height: '44px', display: 'flex', alignItems: 'center', padding: '0 20px' }}>
            Import CSV
            <input type="file" accept=".csv" onChange={handleImport} style={{ display: 'none' }} />
          </label>
        </div>
        <button className="btn btn-gold" onClick={() => navigate('/admin/products/add')} style={{ height: '44px', padding: '0 24px', fontWeight: '700' }}>
          + Add New Product
        </button>
      </div>

      {/* Bulk Action Header */}
      {selectedIds.length > 0 && (
        <div className="animate-fade-in" style={{ 
          background: '#fcfaf7', padding: '16px 24px', borderRadius: '12px', 
          marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          border: '1px solid var(--maroon)', boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ fontWeight: '700', color: 'var(--maroon)', fontSize: '1rem' }}>{selectedIds.length} items selected</span>
            <div style={{ width: '1px', height: '24px', background: '#d8d0c5' }}></div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => handleBulkAction('price')} style={{ fontWeight: '600' }}>Update Price</button>
              <button className="btn btn-ghost btn-sm" onClick={() => handleBulkAction('stock')} style={{ fontWeight: '600' }}>Update Stock</button>
              <button className="btn btn-ghost btn-sm" onClick={() => handleBulkAction('status')} style={{ fontWeight: '600' }}>Toggle Status</button>
              <button className="btn btn-ghost btn-sm" style={{ color: '#d93025', fontWeight: '600' }} onClick={() => handleBulkAction('delete')}>Delete All</button>
            </div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => setSelectedIds([])} style={{ borderColor: '#6b665e', color: '#6b665e' }}>Clear Selection</button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="loading-center"><div className="spinner spinner-lg" /></div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎯</div>
          <div className="empty-state-title">No Products Found</div>
          <div className="empty-state-text">Your product catalogue is currently empty. Start by adding your first luxury item to the collection.</div>
          <button className="btn btn-gold" style={{ marginTop: '24px', height: '48px', padding: '0 32px' }} onClick={() => navigate('/admin/products/add')}>Add First Product</button>
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input type="checkbox" style={{ width: '18px', height: '18px' }} onChange={handleSelectAll} checked={selectedIds.length === products.length && products.length > 0} />
                  </th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id} className={selectedIds.includes(p._id) ? 'row-selected' : ''}>
                    <td>
                      <input type="checkbox" style={{ width: '18px', height: '18px' }} checked={selectedIds.includes(p._id)} onChange={() => toggleSelect(p._id)} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div className="product-img-cell">
                          {p.images?.[0] ? <img src={p.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📦'}
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#1a1917' }}>{p.name}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#6b665e', marginTop: '2px' }}>{p.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: '#444', fontSize: '0.875rem', fontWeight: '500' }}>{p.category?.name || '—'}</td>
                    <td>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: '700', color: '#1a1917' }}>{fmtINR(p.price)}</div>
                      {p.comparePrice > 0 && (
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#999', textDecoration: 'line-through' }}>{fmtINR(p.comparePrice)}</div>
                      )}
                    </td>
                    <td>
                      <span className={stockColor(p.stock)} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: '700' }}>
                        {stockLabel(p.stock)}
                      </span>
                    </td>
                    <td>
                      <span className={`chip chip-${p.isActive ? 'active' : 'draft'}`}>{p.isActive ? 'Active' : 'Draft'}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-outline btn-sm" style={{ fontWeight: '600' }} onClick={() => navigate(`/admin/products/edit/${p._id}`)}>Edit</button>
                        <button className="btn btn-danger btn-sm" style={{ fontWeight: '600' }} disabled={deleting === p._id}
                          onClick={() => handleDelete(p._id, p.name)}>
                          {deleting === p._id ? '…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{pagination.total} products total</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <span style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--muted)' }}>{page} / {pagination.pages}</span>
                <button className="btn btn-outline btn-sm" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            </div>
          )}
        </>
      )}
      {/* Bulk Modals */}
      {showBulkModal && (
        <div className="modal-overlay" onClick={() => !bulkLoading && setShowBulkModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{showBulkModal === 'price' ? 'Bulk Price Adjustment' : showBulkModal === 'stock' ? 'Bulk Stock Update' : 'Bulk Status Toggle'}</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '24px' }}>
              Applying change to <strong>{selectedIds.length}</strong> selected products.
            </p>

            {showBulkModal === 'price' && (
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Adjustment Type</label>
                  <select className="form-input" value={bulkVal.type} onChange={e => setBulkVal({...bulkVal, type: e.target.value})}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Value (+/-)</label>
                  <input className="form-input" type="number" value={bulkVal.amount} onChange={e => setBulkVal({...bulkVal, amount: Number(e.target.value)})} placeholder="e.g. 10 or -500" />
                </div>
              </div>
            )}

            {showBulkModal === 'stock' && (
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Update Type</label>
                  <select className="form-input" value={bulkVal.stockType} onChange={e => setBulkVal({...bulkVal, stockType: e.target.value})}>
                    <option value="add">Add to current stock</option>
                    <option value="set">Set as new stock</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input className="form-input" type="number" value={bulkVal.stock} onChange={e => setBulkVal({...bulkVal, stock: Number(e.target.value)})} placeholder="e.g. 100" />
                </div>
              </div>
            )}

            {showBulkModal === 'status' && (
              <div className="form-group">
                <label className="form-label">Target Status</label>
                <select className="form-input" value={bulkVal.status} onChange={e => setBulkVal({...bulkVal, status: e.target.value === 'true'})}>
                  <option value="true">Active (Published)</option>
                  <option value="false">Draft (Hidden)</option>
                </select>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
              <button className="btn btn-outline" onClick={() => setShowBulkModal(null)} disabled={bulkLoading}>Cancel</button>
              <button className="btn btn-gold" onClick={submitBulkUpdate} disabled={bulkLoading}>
                {bulkLoading ? 'Processing...' : 'Apply mass update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const MOCK_PRODUCTS = [
  { _id: '1', name: 'Versailles Silk Blouse', sku: 'VSB-001', category: { name: 'Apparel' }, price: 8500, comparePrice: 12000, stock: 24, isActive: true },
  { _id: '2', name: 'Onyx Leather Tote', sku: 'OLT-002', category: { name: 'Accessories' }, price: 12500, comparePrice: 18000, stock: 8, isActive: true },
  { _id: '3', name: 'Amber Parfum 50ml', sku: 'APF-003', category: { name: 'Beauty' }, price: 5999, comparePrice: 8500, stock: 0, isActive: true },
  { _id: '4', name: 'Cashmere Overcoat', sku: 'CCO-004', category: { name: 'Apparel' }, price: 24000, comparePrice: 0, stock: 3, isActive: true },
  { _id: '5', name: 'Crystal Pendant', sku: 'CPD-005', category: { name: 'Jewellery' }, price: 6750, comparePrice: 9000, stock: 15, isActive: false },
  { _id: '6', name: 'Satin Evening Gloves', sku: 'SEG-006', category: { name: 'Accessories' }, price: 2200, comparePrice: 0, stock: 42, isActive: true },
];
