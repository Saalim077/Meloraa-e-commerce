import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { logoutUser } from '../../store';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: '⊞', end: true },
  { to: '/admin/products', label: 'Products', icon: '◈' },
  { to: '/admin/orders', label: 'Orders', icon: '◎' },
  { to: '/admin/categories', label: 'Categories', icon: '⊟' },
  { to: '/admin/inventory', label: 'Inventory', icon: '≣' },
  { to: '/admin/reviews', label: 'Reviews', icon: '★' },
  { to: '/admin/coupons', label: 'Coupons', icon: '◇' },
  { to: '/admin/users', label: 'Users', icon: '◉' },
  { to: '/admin/returns', label: 'Returns', icon: '↩' },
  { to: '/admin/financials', label: 'Financials', icon: '₹' },
  { to: '/admin/analytics', label: 'Insights', icon: '📈' },
  { to: '/admin/activity-logs', label: 'Activity Logs', icon: '📜' },
  { to: '/admin/blogs', label: 'Manage Blogs', icon: '📝' },
  { to: '/admin/settings', label: 'Settings', icon: '⚙️' },
];

export default function AdminLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success('Logged out');
    navigate('/login');
  };

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar" style={{ display: mobileOpen || window.innerWidth > 768 ? 'flex' : 'none', flexDirection: 'column' }}>
        {/* Logo */}
        <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: '700', color: 'var(--gold)', letterSpacing: '0.1em' }}>MELORAA</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--muted)', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: '2px' }}>Admin Console</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {NAV.map(({ to, label, icon, end }) => (
            <NavLink key={to} to={to} end={end}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 12px', borderRadius: 'var(--r-md)', marginBottom: '2px',
                fontSize: '0.875rem', fontWeight: isActive ? '600' : '400',
                color: isActive ? 'var(--cream)' : 'var(--muted)',
                background: isActive ? 'var(--ink-mid)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--gold)' : '2px solid transparent',
                transition: 'var(--transition)',
                textDecoration: 'none',
              })}
            >
              <span style={{ fontSize: '1rem', width: '18px', textAlign: 'center' }}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--gold-dim)', border: '1px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: 'var(--gold)', fontWeight: '700' }}>
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <span className="chip chip-admin" style={{ marginTop: '2px' }}>{user?.role}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-ghost btn-sm btn-full" style={{ justifyContent: 'flex-start', color: 'var(--muted)' }}>
            ↩ Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main">
        {/* Top bar */}
        <div className="admin-topbar">
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{today}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <a href="http://localhost:3000" target="_blank" rel="noreferrer"
              style={{ fontSize: '0.75rem', color: 'var(--muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ↗ View Store
            </a>
          </div>
        </div>

        <div className="admin-content fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
