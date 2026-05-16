import React, { useState, useEffect, useCallback } from 'react';
import { analyticsAPI } from '../../utils/api';
import { toast } from 'react-toastify';

export default function AdminAnalytics() {
  const [data, setData] = useState({
    summary: null,
    customers: null,
    products: null
  });
  const [loading, setLoading] = useState(true);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, customerRes, productRes] = await Promise.all([
        analyticsAPI.summary(),
        analyticsAPI.customerInsights(),
        analyticsAPI.productPerformance()
      ]);
      setData({
        summary: summaryRes.data,
        customers: customerRes.data,
        products: productRes.data
      });
    } catch {
      toast.error('Failed to load analytical data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  if (loading && !data.summary) return <div className="loading-center"><div className="spinner spinner-lg" /></div>;

  const { stats } = data.summary || {};
  const { metrics, topCustomers } = data.customers || {};
  const { topPerformers, lowPerformers } = data.products || {};

  // Calculations
  const returnRate = stats?.totalOrders > 0 ? ((stats.totalReturns / stats.totalOrders) * 100).toFixed(1) : 0;
  const repeatRate = metrics?.totalCustomers > 0 ? ((metrics.repeatCustomersCount / metrics.totalCustomers) * 100).toFixed(1) : 0;

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  return (
    <div className="analytics-page">
      <div className="page-header">
        <h1>Performance Analytics</h1>
        <p>In-depth insights into your products, customers, and business health</p>
      </div>

      {/* High-Level Insights */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <div className="stat-card" style={{ padding: '24px', background: '#fff', borderRadius: '16px' }}>
          <div className="stat-label">Return Rate</div>
          <div className="stat-value" style={{ color: 'var(--red)' }}>{returnRate}%</div>
          <div style={{ fontSize: '0.75rem', color: '#8c857d' }}>{stats?.totalReturns} returns from {stats?.totalOrders} orders</div>
        </div>
        <div className="stat-card" style={{ padding: '24px', background: '#fff', borderRadius: '16px' }}>
          <div className="stat-label">Repeat Purchase Rate</div>
          <div className="stat-value" style={{ color: 'var(--sage)' }}>{repeatRate}%</div>
          <div style={{ fontSize: '0.75rem', color: '#8c857d' }}>{metrics?.repeatCustomersCount} loyal customers</div>
        </div>
        <div className="stat-card" style={{ padding: '24px', background: '#fff', borderRadius: '16px' }}>
          <div className="stat-label">Avg. Order Value</div>
          <div className="stat-value" style={{ color: 'var(--gold)' }}>{fmt(stats?.avgOrderValue)}</div>
          <div style={{ fontSize: '0.75rem', color: '#8c857d' }}>Per successful transaction</div>
        </div>
        <div className="stat-card" style={{ padding: '24px', background: '#fff', borderRadius: '16px' }}>
          <div className="stat-label">Avg. Customer LTV</div>
          <div className="stat-value" style={{ color: 'var(--maroon)' }}>{fmt(metrics?.avgCLV)}</div>
          <div style={{ fontSize: '0.75rem', color: '#8c857d' }}>Estimated lifetime value</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        {/* Top Selling Products */}
        <div className="card" style={{ padding: '24px', background: '#fff', borderRadius: '16px', border: '1px solid #f0ebe4' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.2rem' }}>🏆</span> Best Selling Products
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {topPerformers?.map((p, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#fcfaf7', borderRadius: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{p.name}</div>
                  <div style={{ fontSize: '0.7rem', color: '#8c857d' }}>SKU: {p.sku} | {p.totalSold} Units Sold</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '800', color: 'var(--sage)' }}>{fmt(p.totalRevenue)}</div>
                  <div style={{ fontSize: '0.65rem', color: '#8c857d' }}>Revenue</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Worst Selling Products */}
        <div className="card" style={{ padding: '24px', background: '#fff', borderRadius: '16px', border: '1px solid #f0ebe4' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.2rem' }}>⚠️</span> Low Performance Products
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {lowPerformers?.map((p, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#fcfaf7', borderRadius: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{p.name}</div>
                  <div style={{ fontSize: '0.7rem', color: '#8c857d' }}>SKU: {p.sku}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '800', color: 'var(--red)' }}>{p.meta?.purchases || 0} Sold</div>
                  <div style={{ fontSize: '0.65rem', color: '#8c857d' }}>Total Units</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '32px' }}>
        {/* Top Customers */}
        <div className="card" style={{ padding: '24px', background: '#fff', borderRadius: '16px', border: '1px solid #f0ebe4' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px' }}>💎 VIP Customers (Top Spenders)</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer Profile</th>
                <th>Order Count</th>
                <th>Avg. Order Value</th>
                <th>Lifetime Spending</th>
              </tr>
            </thead>
            <tbody>
              {topCustomers?.map((c, idx) => (
                <tr key={idx}>
                  <td>
                    <div style={{ fontWeight: '700' }}>{c.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#8c857d' }}>{c.email}</div>
                  </td>
                  <td style={{ fontWeight: '600' }}>{c.orderCount} Orders</td>
                  <td>{fmt(c.totalSpent / c.orderCount)}</td>
                  <td style={{ fontWeight: '800', color: 'var(--maroon)' }}>{fmt(c.totalSpent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
