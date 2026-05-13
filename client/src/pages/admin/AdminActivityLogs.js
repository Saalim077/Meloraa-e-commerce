import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { adminAPI } from '../../utils/api';

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getActivityLogs({
        entity: entityFilter,
        action: actionFilter,
        page,
        limit: 20
      });
      setLogs(res.data.logs);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  }, [entityFilter, actionFilter, page]);

  useEffect(() => { load(); }, [load]);

  const getActionColor = (action) => {
    if (action === 'create') return 'success';
    if (action === 'delete') return 'danger';
    if (action === 'update') return 'warning';
    return 'info';
  };

  return (
    <div>
      <div className="page-header">
        <h1>Activity Logs</h1>
        <p>Track all admin actions and changes</p>
      </div>

      <div className="admin-filters">
        <select className="form-input" style={{ width: '200px' }} value={entityFilter} onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}>
          <option value="">All Entities</option>
          <option value="product">Products</option>
          <option value="user">Users</option>
          <option value="order">Orders</option>
          <option value="coupon">Coupons</option>
        </select>
        <select className="form-input" style={{ width: '200px' }} value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}>
          <option value="">All Actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="export">Export</option>
        </select>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">◎</div>
            <h3>No activity logs found</h3>
            <p>Try adjusting your filters to see more results or check back later.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Admin</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Entity ID</th>
                  <th>Status</th>
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log._id}>
                    <td>
                      <div style={{ fontSize: '0.9rem' }}>
                        <div style={{ fontWeight: '600' }}>{log.admin?.name || 'Unknown'}</div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{log.admin?.email}</div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getActionColor(log.action)}`}>
                        {log.action.toUpperCase()}
                      </span>
                    </td>
                    <td>{log.entity}</td>
                    <td style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--muted)' }}>
                      {log.entityId?.substring(0, 12)}...
                    </td>
                    <td>
                      <span className={`badge ${log.status === 'success' ? 'success' : 'danger'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>
                        {new Date(log.createdAt).toLocaleDateString()}
                        <br />
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pagination && pagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
                {Array.from({ length: pagination.pages }, (_, i) => (
                  <button
                    key={i + 1}
                    className={`btn btn-small ${page === i + 1 ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
