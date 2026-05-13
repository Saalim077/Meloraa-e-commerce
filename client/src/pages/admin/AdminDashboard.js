import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchAnalytics } from '../../store';

const fmtINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const fmtGrowth = (n) => {
  const v = Number(n || 0);
  return <span style={{ color: v >= 0 ? 'var(--sage)' : 'var(--red)', fontSize: '0.8rem', fontWeight: '700' }}>
    {v >= 0 ? '↑' : '↓'} {Math.abs(v)}%
  </span>;
};

const MOCK_WEEKLY = [
  { day: 'Mon', amount: 82000 }, { day: 'Tue', amount: 145000 }, { day: 'Wed', amount: 98000 },
  { day: 'Thu', amount: 167000 }, { day: 'Fri', amount: 234000 }, { day: 'Sat', amount: 198000 }, { day: 'Sun', amount: 76000 },
];

const MOCK_ORDERS = [
  { orderNumber: 'ORD-2024-00123', user: { name: 'Priya Sharma' }, total: 4299, items: [1, 2, 3], orderStatus: 'delivered', paymentStatus: 'paid', createdAt: '2024-01-15' },
  { orderNumber: 'ORD-2024-00122', user: { name: 'Rahul Verma' }, total: 1850, items: [1], orderStatus: 'shipped', paymentStatus: 'paid', createdAt: '2024-01-15' },
  { orderNumber: 'ORD-2024-00121', user: { name: 'Ananya Iyer' }, total: 7620, items: [1,2,3,4,5], orderStatus: 'processing', paymentStatus: 'paid', createdAt: '2024-01-14' },
  { orderNumber: 'ORD-2024-00120', user: { name: 'Karan Mehta' }, total: 999, items: [1, 2], orderStatus: 'confirmed', paymentStatus: 'pending', createdAt: '2024-01-14' },
  { orderNumber: 'ORD-2024-00119', user: { name: 'Meera Nair' }, total: 3450, items: [1, 2], orderStatus: 'pending', paymentStatus: 'pending', createdAt: '2024-01-13' },
];

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { data, loading } = useSelector(s => s.analytics);

  useEffect(() => { dispatch(fetchAnalytics()); }, [dispatch]);

  const stats = data?.stats || {};
  const recentOrders = data?.recentOrders?.length ? data.recentOrders : MOCK_ORDERS;
  const weeklyData = MOCK_WEEKLY;
  const maxAmt = Math.max(...weeklyData.map(d => d.amount));

  const STAT_CARDS = [
    { label: 'Total Revenue', value: fmtINR(stats.totalRevenue || 847320), growth: stats.revenueGrowth ?? 18.4, icon: '₹', color: 'var(--maroon)' },
    { label: 'Total Orders', value: (stats.totalOrders || 1243).toLocaleString(), growth: stats.ordersGrowth ?? 11.2, icon: '◎', color: 'var(--maroon)' },
    { label: 'Customers', value: (stats.totalUsers || 892).toLocaleString(), growth: stats.customersGrowth ?? 24.7, icon: '◉', color: 'var(--maroon)' },
    { label: 'Avg Order Value', value: fmtINR(stats.avgOrderValue || 681), growth: 6.1, icon: '◈', color: 'var(--maroon)' },
    { label: 'Active Coupons', value: (stats.activeCoupons || 12).toLocaleString(), growth: 0, icon: '◇', color: 'var(--gold)' },
  ];

  const QUICK_ACTIONS = [
    { label: 'Add New Product', icon: '+', to: '/admin/products/add', color: 'var(--gold)' },
    { label: 'View All Orders', icon: '◎', to: '/admin/orders', color: 'var(--maroon)' },
    { label: 'Manage Returns', icon: '↩', to: '/admin/returns', color: 'var(--gold)' },
    { label: 'Create Coupon', icon: '◇', to: '/admin/coupons', color: 'var(--maroon)' },
  ];

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '48px', borderBottom: '1px solid #eee', paddingBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--maroon)', marginBottom: '8px' }}>Executive Summary</h1>
        <p style={{ color: '#888', fontSize: '1.1rem' }}>Overview of your performance and operations for <strong>MELORAA</strong></p>
      </div>

      {loading && !data ? (
        <div className="loading-center"><div className="spinner spinner-lg" /></div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px', marginBottom: '48px' }}>
            {STAT_CARDS.map(({ label, value, growth, icon, color }) => (
              <div key={label} className="stat-card" style={{ padding: '24px', border: '1px solid #eee', background: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '700', color: '#aaa' }}>{label}</span>
                  <div style={{ width: '28px', height: '28px', borderRadius: '4px', background: color === 'var(--gold)' ? 'rgba(201,168,76,0.1)' : 'rgba(79,12,16,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: color, fontSize: '0.9rem', fontWeight: '700' }}>
                    {icon}
                  </div>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '8px', fontFamily: 'var(--font-body)' }}>
                  {value}
                </div>
                <div>
                  {growth !== 0 ? (
                    <div style={{ fontSize: '0.75rem' }}>
                      {fmtGrowth(growth)} <span style={{ color: '#aaa' }}>vs last month</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.75rem', color: '#aaa' }}>Live performance</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Chart + Quick Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '32px', marginBottom: '48px' }}>
            <div className="card" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', margin: 0, color: 'var(--maroon)' }}>Weekly Sales Trend</h3>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '700' }}>Total Week Revenue</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--maroon)' }}>{fmtINR(weeklyData.reduce((a, d) => a + d.amount, 0))}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', height: '200px', padding: '20px 0' }}>
                {weeklyData.map(({ day, amount }) => (
                  <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', height: '100%' }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%', background: '#fcfcfc', borderRadius: '4px', overflow: 'hidden' }}>
                      <div 
                        style={{ width: '100%', background: 'var(--maroon)', height: `${(amount / maxAmt) * 100}%`, transition: 'height 1s ease', borderRadius: '2px' }} 
                        title={fmtINR(amount)} 
                      />
                    </div>
                    <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#aaa', textTransform: 'uppercase' }}>{day}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding: '32px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: '24px', color: 'var(--maroon)' }}>Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {QUICK_ACTIONS.map(({ label, icon, to, color }) => (
                  <button 
                    key={to} 
                    onClick={() => navigate(to)} 
                    className="btn-quick-action"
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', 
                      background: 'white', border: '1px solid #eee', borderRadius: '0', 
                      cursor: 'pointer', transition: 'all 0.3s', textAlign: 'left',
                      width: '100%'
                    }}
                    onMouseOver={e => e.currentTarget.style.borderColor = 'var(--maroon)'}
                    onMouseOut={e => e.currentTarget.style.borderColor = '#eee'}
                  >
                    <span style={{ color, fontSize: '1.2rem', width: '24px', textAlign: 'center' }}>{icon}</span>
                    <span style={{ fontWeight: '700', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', margin: 0, color: 'var(--maroon)' }}>Latest Orders</h3>
                <p style={{ color: '#aaa', fontSize: '0.85rem', margin: '4px 0 0' }}>Transaction summary from last 24 hours</p>
              </div>
              <button className="btn-view-all" onClick={() => navigate('/admin/orders')} style={{ background: 'transparent', border: 'none', color: 'var(--maroon)', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', padding: '0 0 4px', borderBottom: '2px solid var(--maroon)' }}>
                View All Orders
              </button>
            </div>
            <div className="table-wrap" style={{ borderRadius: '0', border: '1px solid #eee' }}>
              <table className="data-table" style={{ borderCollapse: 'separate', borderSpacing: '0' }}>
                <thead>
                  <tr>
                    <th style={{ background: '#fafafa', borderBottom: '1px solid #eee' }}>Order Reference</th>
                    <th style={{ background: '#fafafa', borderBottom: '1px solid #eee' }}>Customer</th>
                    <th style={{ background: '#fafafa', borderBottom: '1px solid #eee' }}>Revenue</th>
                    <th style={{ background: '#fafafa', borderBottom: '1px solid #eee' }}>Items</th>
                    <th style={{ background: '#fafafa', borderBottom: '1px solid #eee' }}>Order Status</th>
                    <th style={{ background: '#fafafa', borderBottom: '1px solid #eee' }}>Payment</th>
                    <th style={{ background: '#fafafa', borderBottom: '1px solid #eee' }}>Transaction Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.orderNumber || order._id}>
                      <td style={{ borderBottom: '1px solid #eee' }}><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--maroon)', fontWeight: '700' }}>{order.orderNumber || `#${(order._id||'').substring(0,8).toUpperCase()}`}</span></td>
                      <td style={{ borderBottom: '1px solid #eee' }}><div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{order.user?.name || order.shippingAddress?.firstName || 'Guest'}</div></td>
                      <td style={{ borderBottom: '1px solid #eee' }}><div style={{ fontWeight: '700', color: '#1a1a1a' }}>{fmtINR(order.total)}</div></td>
                      <td style={{ borderBottom: '1px solid #eee', color: '#888' }}>{order.items?.length || 0} unit(s)</td>
                      <td style={{ borderBottom: '1px solid #eee' }}><span className={`chip chip-${order.orderStatus}`} style={{ borderRadius: '0', fontSize: '0.65rem' }}>{order.orderStatus}</span></td>
                      <td style={{ borderBottom: '1px solid #eee' }}><span className={`chip chip-${order.paymentStatus}`} style={{ borderRadius: '0', fontSize: '0.65rem' }}>{order.paymentStatus}</span></td>
                      <td style={{ borderBottom: '1px solid #eee', color: '#aaa', fontSize: '0.8rem' }}>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
