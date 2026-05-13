import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { returnAPI } from '../../utils/api';
import { toast } from 'react-toastify';

const STATUS_TABS = ['All', 'Pending', 'Approved', 'In Transit', 'Completed', 'Rejected', 'Cancelled'];
const TYPE_FILTERS = ['All', 'Return', 'Refund', 'Exchange'];

export default function AdminReturns() {
  const navigate = useNavigate();
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const [activeType, setActiveType] = useState('All');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        status: activeTab === 'All' ? '' : activeTab.toLowerCase().replace(/ /g, '_'),
        type: activeType === 'All' ? '' : activeType.toLowerCase(),
        search
      };
      const [res, statsRes] = await Promise.all([
        returnAPI.getAll(params),
        returnAPI.analytics()
      ]);
      setReturns(res.data.returns);
      setPagination(res.data.pagination);
      setStats(statsRes.data.stats);
    } catch (err) {
      toast.error('Failed to load returns');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, activeTab, activeType, search]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return (
    <div>
      <div className="page-header">
        <h1>Returns & Refunds</h1>
        <p>Manage Return Merchandise Authorization (RMA) requests</p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Total This Month</div>
          <div style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'var(--font-serif)' }}>{stats?.totalReturns || 0}</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Pending Review</div>
          <div style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'var(--font-serif)', color: 'var(--gold)' }}>{stats?.pendingCount || 0}</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Refund Amount</div>
          <div style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'var(--font-serif)' }}>₹{Number(stats?.refundedAmount || 0).toLocaleString('en-IN')}</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Return Rate</div>
          <div style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'var(--font-serif)' }}>{stats?.returnRate}%</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {TYPE_FILTERS.map(t => (
              <button key={t} onClick={() => setActiveType(t)} style={{ 
                padding: '6px 16px', borderRadius: '20px', border: '1px solid #2e2c29', fontSize: '13px', cursor: 'pointer',
                background: activeType === t ? 'var(--gold)' : 'transparent', color: activeType === t ? '#000' : 'var(--text)'
              }}>{t}</button>
            ))}
          </div>
          <div className="search-bar" style={{ maxWidth: '300px' }}>
            <span style={{ color: 'var(--muted)' }}>⌕</span>
            <input placeholder="RMA # or Customer..." value={search} onChange={handleSearch} />
          </div>
        </div>
        <div style={{ display: 'flex', borderBottom: '1px solid #2e2c29' }}>
          {STATUS_TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ 
              padding: '12px 20px', border: 'none', background: 'none', color: activeTab === tab ? 'var(--gold)' : 'var(--muted)',
              borderBottom: activeTab === tab ? '2px solid var(--gold)' : 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500'
            }}>{tab}</button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="loading-center"><div className="spinner spinner-lg" /></div>
      ) : returns.length === 0 ? (
        <div className="empty-state card">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>↩</div>
          <h3>No return requests found</h3>
          <p>Try changing your filters or search query</p>
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>RMA #</th>
                  <th>Customer</th>
                  <th>Order</th>
                  <th>Type</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Requested</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {returns.map(r => (
                  <tr key={r._id}>
                    <td><span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold)', fontSize: '13px' }}>{r.rmaNumber}</span></td>
                    <td>
                      <div style={{ fontSize: '14px', fontWeight: '500' }}>{r.user?.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{r.user?.email}</div>
                    </td>
                    <td><Link to={`/admin/orders/${r.order?._id}`} style={{ color: 'inherit', fontSize: '13px' }}>#{r.order?.orderNumber}</Link></td>
                    <td><span className={`chip chip-${r.type}`} style={{ textTransform: 'capitalize' }}>{r.type}</span></td>
                    <td>{r.items.length}</td>
                    <td>₹{Number(r.refundAmount || r.items.reduce((acc, i) => acc + (i.price * i.quantity), 0)).toLocaleString('en-IN')}</td>
                    <td><span className={`chip chip-${r.status}`} style={{ textTransform: 'capitalize' }}>{r.status.replace(/_/g, ' ')}</span></td>
                    <td style={{ fontSize: '13px', color: 'var(--muted)' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => navigate(`/admin/returns/${r._id}`)}>Review</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px' }}>
              <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{pagination.total} requests total</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-outline btn-sm" disabled={pagination.page <= 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}>← Prev</button>
                <span style={{ padding: '6px 12px', fontSize: '13px', color: 'var(--muted)' }}>{pagination.page} / {pagination.pages}</span>
                <button className="btn btn-outline btn-sm" disabled={pagination.page >= pagination.pages} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}>Next →</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
