import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { adminAPI } from '../../utils/api';

const fmtINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function AdminInventory() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolved, setResolved] = useState(false);
  const [alertType, setAlertType] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const load = useCallback(async () => {
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

  useEffect(() => { load(); }, [load]);

  const handleResolve = async (id) => {
    try {
      await adminAPI.resolveInventoryAlert(id);
      toast.success('Alert resolved');
      load();
    } catch {
      toast.error('Failed to resolve alert');
    }
  };

  const getAlertColor = (type) => {
    return type === 'out_of_stock' ? 'danger' : 'warning';
  };

  return (
    <div>
      <div className="page-header">
        <h1>Inventory Management</h1>
        <p>Monitor stock levels and alerts</p>
      </div>

      <div className="admin-filters">
        <select className="form-input" style={{ width: '220px' }} value={alertType} onChange={(e) => { setAlertType(e.target.value); setPage(1); }}>
          <option value="">All Alerts</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', color: '#1a1917' }}>
          <input
            type="checkbox"
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            checked={resolved}
            onChange={(e) => { setResolved(e.target.checked); setPage(1); }}
          />
          Show Resolved Only
        </label>
      </div>

      <div className="table-wrap" style={{ padding: '24px' }}>
        {loading ? (
          <div className="loading-center"><div className="spinner spinner-lg" /></div>
        ) : alerts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎯</div>
            <div className="empty-state-title">{resolved ? 'No Resolved Alerts' : 'Inventory Healthy'}</div>
            <div className="empty-state-text">
              {resolved ? 'You haven\'t resolved any alerts yet.' : 'All products are currently in stock and above their thresholds. Great job on inventory management!'}
            </div>
          </div>
        ) : (
          <>
            {alerts.map(alert => (
              <div key={alert._id} style={{
                borderLeft: `5px solid ${alert.alertType === 'out_of_stock' ? '#d93025' : '#b05a00'}`,
                padding: '20px',
                marginBottom: '16px',
                backgroundColor: '#ffffff',
                border: '1px solid #e8e2db',
                borderLeftWidth: '5px',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '6px', color: '#1a1917' }}>
                    {alert.product?.name}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#6b665e', marginBottom: '12px' }}>
                    SKU: <span style={{ fontWeight: '600' }}>{alert.product?.sku}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '20px', fontSize: '0.9rem', color: '#444' }}>
                    <span><strong>Current Stock:</strong> {alert.currentStock || alert.product?.stock || 0}</span>
                    <span><strong>Threshold:</strong> {alert.threshold}</span>
                  </div>
                  <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                    <span className={`chip chip-${alert.alertType === 'out_of_stock' ? 'danger' : 'warning'}`}>
                      {alert.alertType === 'out_of_stock' ? '❌ Out of Stock' : '⚠️ Low Stock'}
                    </span>
                    {alert.resolved && <span className="chip chip-active">✓ Resolved</span>}
                  </div>
                </div>
                {!alert.resolved && (
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => handleResolve(alert._id)}
                    style={{ minWidth: '120px' }}
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            ))}

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
          </>
        )}
      </div>
    </div>
  );
}
