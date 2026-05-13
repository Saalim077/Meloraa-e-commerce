import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { adminAPI, bulkAPI } from '../../utils/api';

const fmtINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function AdminInventory() {
  const [activeTab, setActiveTab] = useState('alerts'); // 'alerts' or 'full'
  const [alerts, setAlerts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolved, setResolved] = useState(false);
  const [alertType, setAlertType] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getInventoryAlerts({
        resolved: resolved ? 'true' : 'false',
        alertType,
        page,
        limit: 15
      });
      setAlerts(res.data.alerts);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, [resolved, alertType, page]);

  const loadFullInventory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getAllInventory({
        page,
        limit: 20,
        search
      });
      setProducts(res.data.products);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    if (activeTab === 'alerts') loadAlerts();
    else loadFullInventory();
  }, [activeTab, loadAlerts, loadFullInventory]);

  const handleResolve = async (id) => {
    try {
      await adminAPI.resolveInventoryAlert(id);
      toast.success('Alert resolved');
      loadAlerts();
    } catch {
      toast.error('Failed to resolve alert');
    }
  };

  const handleDownload = async () => {
    try {
      toast.info('Preparing your inventory export with variations...');
      const response = await bulkAPI.exportProducts();
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `meloraa-inventory-full-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Detailed inventory downloaded');
    } catch (err) {
      toast.error('Failed to download inventory');
    }
  };

  return (
    <div style={{ padding: '0 20px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--maroon)', marginBottom: '8px' }}>Inventory Command</h1>
          <p style={{ color: '#888', fontSize: '1.1rem' }}>Executive oversight of <strong>MELORAA</strong> warehouse operations</p>
        </div>
        <button 
          onClick={handleDownload}
          className="btn" 
          style={{ 
            background: 'var(--maroon)', 
            color: 'white', 
            padding: '12px 24px', 
            borderRadius: '8px',
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(79, 12, 16, 0.2)',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>📥</span> Export Full Excel
        </button>
      </div>

      {/* Modern Tabs */}
      <div style={{ display: 'flex', gap: '40px', marginBottom: '40px', borderBottom: '1px solid #eee' }}>
        <button 
          onClick={() => { setActiveTab('alerts'); setPage(1); }}
          style={{ 
            padding: '16px 8px', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'alerts' ? '3px solid var(--maroon)' : '3px solid transparent',
            color: activeTab === 'alerts' ? 'var(--maroon)' : '#888',
            fontWeight: activeTab === 'alerts' ? '700' : '500',
            cursor: 'pointer',
            fontSize: '1.1rem',
            transition: 'all 0.3s ease'
          }}
        >
          Stock Alerts {alerts.length > 0 && activeTab !== 'alerts' && <span style={{ background: '#d93025', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', marginLeft: '6px' }}>{alerts.length}</span>}
        </button>
        <button 
          onClick={() => { setActiveTab('full'); setPage(1); }}
          style={{ 
            padding: '16px 8px', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'full' ? '3px solid var(--maroon)' : '3px solid transparent',
            color: activeTab === 'full' ? 'var(--maroon)' : '#888',
            fontWeight: activeTab === 'full' ? '700' : '500',
            cursor: 'pointer',
            fontSize: '1.1rem',
            transition: 'all 0.3s ease'
          }}
        >
          Master Inventory
        </button>
      </div>

      {/* Filter Section */}
      <div style={{ 
        marginBottom: '32px', 
        background: '#fcfaf8', 
        padding: '24px', 
        borderRadius: '12px', 
        border: '1px solid #e8e2db',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px'
      }}>
        {activeTab === 'alerts' ? (
          <>
            <div style={{ display: 'flex', gap: '16px' }}>
              <select className="form-input" style={{ width: '240px', padding: '12px', borderRadius: '8px' }} value={alertType} onChange={(e) => { setAlertType(e.target.value); setPage(1); }}>
                <option value="">Filter by Alert Type</option>
                <option value="low_stock">Low Stock (Threshold hit)</option>
                <option value="out_of_stock">Out of Stock (Zero count)</option>
              </select>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem', fontWeight: '600', color: 'var(--maroon)', cursor: 'pointer' }}>
              <input type="checkbox" style={{ width: '20px', height: '20px' }} checked={resolved} onChange={(e) => { setResolved(e.target.checked); setPage(1); }} />
              Include Resolved Alerts
            </label>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }}>🔍</span>
                <input 
                  type="text" 
                  placeholder="Search products by name or SKU..." 
                  className="form-input" 
                  style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem' }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && setPage(1)}
                />
              </div>
              <button 
                className="btn" 
                onClick={() => setPage(1)}
                style={{ background: 'var(--maroon)', color: 'white', padding: '0 32px', borderRadius: '8px', fontWeight: '600' }}
              >
                SEARCH
              </button>
            </div>
          </>
        )}
      </div>

      {/* Main Table Area */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #eee', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.03)' }}>
        {loading ? (
          <div className="loading-center" style={{ padding: '80px' }}><div className="spinner spinner-lg" /></div>
        ) : activeTab === 'alerts' ? (
          <div style={{ padding: '24px' }}>
            {alerts.length === 0 ? (
              <div className="empty-state" style={{ padding: '80px' }}>
                <div style={{ fontSize: '4rem', marginBottom: '24px' }}>✨</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--maroon)' }}>Inventory is Healthy</h3>
                <p style={{ color: '#888', fontSize: '1.1rem' }}>No pending alerts. All stock levels are currently within safe limits.</p>
              </div>
            ) : (
              alerts.map(alert => (
                <div key={alert._id} style={{
                  borderLeft: `6px solid ${alert.alertType === 'out_of_stock' ? '#d93025' : '#b05a00'}`,
                  padding: '32px',
                  marginBottom: '20px',
                  backgroundColor: '#fff',
                  border: '1px solid #f0f0f0',
                  borderLeftWidth: '6px',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'transform 0.2s ease',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.02)'
                }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '1.4rem', marginBottom: '8px', color: 'var(--maroon)' }}>{alert.product?.name}</div>
                    <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '20px' }}>SKU IDENTIFIER: <strong style={{ color: '#1a1a1a' }}>{alert.product?.sku}</strong></div>
                    <div style={{ display: 'flex', gap: '40px' }}>
                      <div style={{ background: '#f8f8f8', padding: '12px 20px', borderRadius: '8px' }}>
                        <span style={{ color: '#888', fontSize: '0.8rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Level</span>
                        <strong style={{ fontSize: '1.2rem', color: alert.currentStock === 0 ? '#d93025' : '#1a1a1a' }}>{alert.currentStock} Units</strong>
                      </div>
                      <div style={{ background: '#f8f8f8', padding: '12px 20px', borderRadius: '8px' }}>
                        <span style={{ color: '#888', fontSize: '0.8rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Safety Limit</span>
                        <strong style={{ fontSize: '1.2rem' }}>{alert.threshold} Units</strong>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ marginBottom: '20px' }}>
                      <span style={{ 
                        padding: '8px 16px', 
                        borderRadius: '20px', 
                        fontSize: '0.85rem', 
                        fontWeight: '700', 
                        background: alert.alertType === 'out_of_stock' ? '#feebee' : '#fff3e0',
                        color: alert.alertType === 'out_of_stock' ? '#c62828' : '#e65100',
                        textTransform: 'uppercase'
                      }}>
                        {alert.alertType === 'out_of_stock' ? '🚨 OUT OF STOCK' : '⚠️ LOW STOCK ALERT'}
                      </span>
                    </div>
                    {!alert.resolved && (
                      <button 
                        className="btn btn-outline" 
                        onClick={() => handleResolve(alert._id)}
                        style={{ padding: '10px 24px', borderRadius: '8px' }}
                      >
                        Acknowledge & Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#fcfaf8', borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '24px', color: '#888', fontWeight: '700', textTransform: 'uppercase', fontSize: '0.85rem' }}>Product & Variations</th>
                <th style={{ padding: '24px', color: '#888', fontWeight: '700', textTransform: 'uppercase', fontSize: '0.85rem' }}>Stock Identifier (SKU)</th>
                <th style={{ padding: '24px', color: '#888', fontWeight: '700', textTransform: 'uppercase', fontSize: '0.85rem' }}>Category</th>
                <th style={{ padding: '24px', color: '#888', fontWeight: '700', textTransform: 'uppercase', fontSize: '0.85rem' }}>Inventory Status</th>
                <th style={{ padding: '24px', color: '#888', fontWeight: '700', textTransform: 'uppercase', fontSize: '0.85rem' }}>Price</th>
                <th style={{ padding: '24px', color: '#888', fontWeight: '700', textTransform: 'uppercase', fontSize: '0.85rem' }}>Market Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <React.Fragment key={p._id}>
                  {/* Main Product */}
                  <tr style={{ borderBottom: '1px solid #f0f0f0', background: p.hasVariants ? '#fffcf9' : 'white' }}>
                    <td style={{ padding: '24px' }}>
                      <div style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--maroon)', marginBottom: '4px' }}>{p.name}</div>
                      {p.hasVariants && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--gold)', fontWeight: '700', textTransform: 'uppercase' }}>
                          <span style={{ width: '6px', height: '6px', background: 'var(--gold)', borderRadius: '50%' }}></span>
                          Multi-Variant Collection
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '24px' }}><code style={{ background: '#f5f5f5', padding: '4px 8px', borderRadius: '4px', fontSize: '0.9rem', color: '#555' }}>{p.sku}</code></td>
                    <td style={{ padding: '24px', color: '#666', fontWeight: '500' }}>{p.category?.name || 'Uncategorized'}</td>
                    <td style={{ padding: '24px' }}>
                      {p.hasVariants ? (
                        <span style={{ color: '#aaa', fontSize: '0.9rem', fontStyle: 'italic' }}>See variations below</span>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '80px', height: '8px', background: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ 
                              width: `${Math.min(100, (p.stock / 20) * 100)}%`, 
                              height: '100%', 
                              background: p.stock === 0 ? '#d93025' : (p.stock < 5 ? '#ff9800' : '#4caf50'),
                              transition: 'width 0.5s ease'
                            }} />
                          </div>
                          <span style={{ fontWeight: '800', fontSize: '1.1rem', color: p.stock === 0 ? '#d93025' : (p.stock < 5 ? '#ff9800' : '#1a1a1a') }}>
                            {p.stock}
                          </span>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '24px', fontWeight: '700', color: '#1a1a1a' }}>{fmtINR(p.price)}</td>
                    <td style={{ padding: '24px' }}>
                      <span style={{ 
                        padding: '6px 14px', 
                        borderRadius: '20px', 
                        fontSize: '0.75rem', 
                        fontWeight: '700', 
                        background: p.isActive ? '#e8f5e9' : '#fafafa',
                        color: p.isActive ? '#2e7d32' : '#999',
                        textTransform: 'uppercase'
                      }}>
                        {p.isActive ? '● LIVE' : '○ HIDDEN'}
                      </span>
                    </td>
                  </tr>

                  {/* Variation Rows */}
                  {p.hasVariants && p.variants.map((v, idx) => (
                    <tr key={v._id} style={{ background: '#fff', borderBottom: idx === p.variants.length - 1 ? '1px solid #f0f0f0' : '1px dashed #f0f0f0' }}>
                      <td style={{ padding: '16px 24px 16px 64px', position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '44px', top: '0', bottom: '0', width: '2px', background: '#eee' }}></div>
                        <div style={{ position: 'absolute', left: '44px', top: '50%', width: '12px', height: '2px', background: '#eee' }}></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontWeight: '600', color: '#555' }}>{v.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}><code style={{ fontSize: '0.85rem', color: '#888' }}>{v.sku || p.sku}</code></td>
                      <td style={{ padding: '16px 24px', color: '#ccc' }}>—</td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '80px', height: '6px', background: '#f5f5f5', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ 
                              width: `${Math.min(100, (v.stock / 20) * 100)}%`, 
                              height: '100%', 
                              background: v.stock === 0 ? '#d93025' : (v.stock < 5 ? '#ff9800' : '#8bc34a'),
                              transition: 'width 0.5s ease'
                            }} />
                          </div>
                          <span style={{ fontWeight: '700', fontSize: '1rem', color: v.stock === 0 ? '#d93025' : (v.stock < 5 ? '#ff9800' : '#666') }}>
                            {v.stock}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', color: '#888', fontSize: '0.95rem' }}>{fmtINR(v.price || p.price)}</td>
                      <td style={{ padding: '16px 24px' }}></td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}

        {/* Improved Pagination */}
        {pagination && pagination.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', padding: '40px 0' }}>
            <button 
              className="btn btn-outline btn-sm" 
              disabled={page === 1} 
              onClick={() => setPage(page - 1)}
              style={{ padding: '8px 16px' }}
            >
              PREVIOUS
            </button>
            <div style={{ display: 'flex', gap: '8px' }}>
              {Array.from({ length: pagination.pages }, (_, i) => (
                <button
                  key={i + 1}
                  className={`btn btn-sm ${page === i + 1 ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setPage(i + 1)}
                  style={{ 
                    minWidth: '40px', 
                    borderRadius: '6px', 
                    background: page === i + 1 ? 'var(--maroon)' : 'white',
                    color: page === i + 1 ? 'white' : '#888',
                    border: '1px solid #ddd'
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button 
              className="btn btn-outline btn-sm" 
              disabled={page === pagination.pages} 
              onClick={() => setPage(page + 1)}
              style={{ padding: '8px 16px' }}
            >
              NEXT
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
