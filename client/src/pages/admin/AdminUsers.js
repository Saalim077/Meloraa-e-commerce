import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { userAdminAPI } from '../../utils/api';

const MOCK_USERS = [
  { _id: '1', name: 'Admin User', email: 'admin@luxestore.com', role: 'admin', status: 'active', createdAt: '2023-01-01', lastLogin: '2024-01-15' },
  { _id: '2', name: 'Priya Sharma', email: 'priya@gmail.com', role: 'user', status: 'active', createdAt: '2023-08-12', lastLogin: '2024-01-14' },
  { _id: '3', name: 'Staff Member', email: 'staff@luxestore.com', role: 'staff', status: 'active', createdAt: '2023-03-20', lastLogin: '2024-01-12' },
  { _id: '4', name: 'Rahul Verma', email: 'rahul@gmail.com', role: 'user', status: 'active', createdAt: '2023-11-05', lastLogin: '2024-01-10' },
  { _id: '5', name: 'Meera Nair', email: 'meera@gmail.com', role: 'user', status: 'blocked', createdAt: '2023-09-18', lastLogin: '2023-12-01' },
  { _id: '6', name: 'Karan Mehta', email: 'karan@gmail.com', role: 'user', status: 'active', createdAt: '2023-07-22', lastLogin: '2024-01-08' },
];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [updating, setUpdating] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userAdminAPI.getAll({ search, role: roleFilter });
      setUsers(res.data.users);
    } catch { setUsers(MOCK_USERS); }
    finally { setLoading(false); }
  }, [search, roleFilter]);

  useEffect(() => { load(); }, [load]);

  const handleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'blocked' : 'active';
    setUpdating(user._id);
    try {
      await userAdminAPI.updateStatus(user._id, newStatus);
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, status: newStatus } : u));
      toast.success(`User ${newStatus === 'active' ? 'unblocked' : 'blocked'}`);
    } catch { toast.error('Update failed'); }
    finally { setUpdating(null); }
  };

  const handleRole = async (userId, role) => {
    setUpdating(userId);
    try {
      await userAdminAPI.updateRole(userId, role);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role } : u));
      toast.success('Role updated');
    } catch { toast.error('Update failed'); }
    finally { setUpdating(null); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"?`)) return;
    try { await userAdminAPI.remove(id); toast.success('User deleted'); load(); } catch { toast.error('Failed'); }
  };

  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const handleViewDetails = async (userId) => {
    setLoadingDetails(true);
    setSelectedUser(userId);
    try {
      const res = await userAdminAPI.getDetails(userId);
      setUserDetails(res.data);
    } catch {
      toast.error('Failed to load user details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const blockedUsers = users.filter(u => u.status === 'blocked').length;
  const staffAdmin = users.filter(u => ['admin', 'staff'].includes(u.role)).length;

  const STAT_MINI = [
    { label: 'Total Customers', value: totalUsers, color: 'var(--gold)' },
    { label: 'Active Status', value: activeUsers, color: 'var(--sage)' },
    { label: 'Blocked Accounts', value: blockedUsers, color: 'var(--red)' },
    { label: 'Management Team', value: staffAdmin, color: '#8a9ff0' },
  ];

  const fmtINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  return (
    <div className="customer-management">
      <div className="page-header">
        <h1>Customer Management</h1>
        <p>Monitor customer behavior, purchase history, and account status</p>
      </div>

      {/* Mini Stats */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        {STAT_MINI.map(({ label, value, color }) => (
          <div key={label} className="stat-card" style={{ padding: '24px', background: '#fff', borderRadius: '16px', border: '1px solid #f0ebe4' }}>
            <div className="stat-label" style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#8c857d', letterSpacing: '0.05em', marginBottom: '12px' }}>{label}</div>
            <div className="stat-value" style={{ fontSize: '2rem', fontWeight: '800', color: color, margin: 0 }}>{value}</div>
          </div>
        ))}
      </div>
 
      {/* Toolbar */}
      <div className="admin-filters">
        <div className="search-bar" style={{ flex: 1, maxWidth: '400px' }}>
          <span>⌕</span>
          <input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-input" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ width: '180px' }}>
          <option value="">All Account Types</option>
          <option value="user">Customers</option>
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </select>
      </div>
 
      {loading ? (
        <div className="loading-center"><div className="spinner spinner-lg" /></div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Profile</th><th>Account Type</th><th>Status</th><th>Relationship</th><th>Activity</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.filter(u =>
                (!search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())) &&
                (!roleFilter || u.role === roleFilter)
              ).map(user => (
                <tr key={user._id} style={{ opacity: updating === user._id ? 0.6 : 1 }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#f0ebe4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1rem', color: 'var(--maroon)', flexShrink: 0, border: '1px solid #e8e2db' }}>
                        {user.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#1a1917' }}>{user.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#8c857d' }}>{user.email}</div>
                        {user.phone && <div style={{ fontSize: '0.7rem', color: 'var(--maroon)', fontWeight: '600', marginTop: '2px' }}>{user.phone}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <select className="form-input" value={user.role} onChange={e => handleRole(user._id, e.target.value)} disabled={updating === user._id}
                      style={{ padding: '6px 12px', fontSize: '0.75rem', width: '110px' }}>
                      <option value="user">Customer</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>
                    <span className={`chip chip-${user.status === 'active' ? 'success' : 'danger'}`} style={{ textTransform: 'capitalize', fontWeight: '700', fontSize: '0.7rem' }}>
                      {user.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#6b665e', fontWeight: '500' }}>
                    <div style={{ fontWeight: '700', color: '#1a1917' }}>Joined</div>
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#6b665e', fontWeight: '500' }}>
                    <div style={{ fontWeight: '700', color: '#1a1917' }}>Last Seen</div>
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Never'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => handleViewDetails(user._id)} title="View Customer History">View</button>
                      <button className={`btn btn-sm ${user.status === 'active' ? 'btn-ghost' : 'btn-outline'}`}
                        disabled={updating === user._id} onClick={() => handleStatus(user)} style={{ fontSize: '0.75rem' }}>
                        {user.status === 'active' ? 'Block' : 'Unblock'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Customer Details Modal */}
      {selectedUser && (
        <div className="order-modal-overlay" onClick={() => { setSelectedUser(null); setUserDetails(null); }}>
          <div className="order-modal" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
            {loadingDetails ? (
              <div className="loading-center" style={{ height: '400px' }}><div className="spinner spinner-lg" /></div>
            ) : userDetails ? (
              <>
                <div className="order-modal-header" style={{ background: 'var(--maroon)', color: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: '900' }}>
                      {userDetails.user.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#fff' }}>{userDetails.user.name}</h2>
                      <div style={{ opacity: 0.8, fontSize: '0.9rem' }}>{userDetails.user.email} | {userDetails.user.phone || 'No phone'}</div>
                    </div>
                  </div>
                  <button className="btn btn-ghost" onClick={() => { setSelectedUser(null); setUserDetails(null); }} style={{ color: '#fff' }}>✕</button>
                </div>

                <div style={{ padding: '32px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                    <div className="stat-card" style={{ padding: '20px', background: '#fcfaf7' }}>
                      <div className="stat-label">Lifetime Value</div>
                      <div className="stat-value" style={{ color: 'var(--maroon)' }}>{fmtINR(userDetails.stats.totalSpent)}</div>
                    </div>
                    <div className="stat-card" style={{ padding: '20px', background: '#fcfaf7' }}>
                      <div className="stat-label">Total Orders</div>
                      <div className="stat-value" style={{ color: 'var(--maroon)' }}>{userDetails.stats.orderCount}</div>
                    </div>
                    <div className="stat-card" style={{ padding: '20px', background: '#fcfaf7' }}>
                      <div className="stat-label">Member Since</div>
                      <div className="stat-value" style={{ fontSize: '1.1rem', marginTop: '10px' }}>
                        {new Date(userDetails.user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  <div className="order-modal-info-grid" style={{ marginBottom: '32px' }}>
                    <div className="order-info-card">
                      <div className="order-info-label" style={{ fontSize: '0.8rem', marginBottom: '12px' }}>Customer Addresses</div>
                      {userDetails.user.addresses?.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {userDetails.user.addresses.map((addr, idx) => (
                            <div key={idx} style={{ fontSize: '0.85rem', padding: '12px', background: '#fff', border: '1px solid #f0ebe4', borderRadius: '8px' }}>
                              <strong>{addr.type?.toUpperCase()} ADDRESS</strong><br/>
                              {addr.address}<br/>
                              {addr.city}, {addr.state} {addr.zipCode}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.85rem', color: '#999' }}>No saved addresses</div>
                      )}
                    </div>
                    <div className="order-info-card">
                      <div className="order-info-label" style={{ fontSize: '0.8rem', marginBottom: '12px' }}>Purchase History</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {userDetails.orders?.length > 0 ? (
                          userDetails.orders.slice(0, 5).map(o => (
                            <div key={o._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', padding: '10px', background: '#fff', borderBottom: '1px solid #f0ebe4' }}>
                              <div>
                                <div style={{ fontWeight: '700' }}>#{o.orderNumber || o._id.substring(0,8).toUpperCase()}</div>
                                <div style={{ fontSize: '0.7rem', color: '#8c857d' }}>{new Date(o.createdAt).toLocaleDateString()}</div>
                                <div style={{ fontSize: '0.75rem', color: '#1a1917', marginTop: '4px', maxWidth: '250px' }}>
                                  <strong>Deliver to:</strong> {o.shippingAddress?.address}, {o.shippingAddress?.city}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--maroon)', fontWeight: '600' }}>
                                  Ph: {o.shippingAddress?.phone}
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: '700', color: 'var(--maroon)' }}>{fmtINR(o.total)}</div>
                                <div style={{ fontSize: '0.7rem', textTransform: 'capitalize', color: o.paymentStatus === 'paid' ? 'var(--sage)' : 'var(--gold)' }}>{o.paymentStatus}</div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{ fontSize: '0.85rem', color: '#999' }}>No orders found</div>
                        )}
                        {userDetails.orders?.length > 5 && (
                          <div style={{ fontSize: '0.75rem', textAlign: 'center', color: '#8c857d', marginTop: '5px' }}>+ {userDetails.orders.length - 5} more orders</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button className="btn btn-outline" onClick={() => { setSelectedUser(null); setUserDetails(null); }}>Close Profile</button>
                    <button className="btn btn-maroon" onClick={() => window.location.href = `/admin/orders?user=${userDetails.user._id}`}>View All Orders</button>
                  </div>
                </div>
              </>
            ) : (
              <div className="error-center">User details not found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
