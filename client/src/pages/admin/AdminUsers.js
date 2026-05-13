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

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const blockedUsers = users.filter(u => u.status === 'blocked').length;
  const staffAdmin = users.filter(u => ['admin', 'staff'].includes(u.role)).length;

  const STAT_MINI = [
    { label: 'Total Users', value: totalUsers, color: 'var(--gold)' },
    { label: 'Active', value: activeUsers, color: 'var(--sage)' },
    { label: 'Blocked', value: blockedUsers, color: 'var(--red)' },
    { label: 'Admin / Staff', value: staffAdmin, color: '#8a9ff0' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Users</h1>
        <p>Manage customer accounts and team members</p>
      </div>

      {/* Mini Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        {STAT_MINI.map(({ label, value, color }) => (
          <div key={label} className="stat-card" style={{ padding: '24px' }}>
            <div className="stat-label" style={{ marginBottom: '8px' }}>{label}</div>
            <div className="stat-value" style={{ color: color, marginBottom: 0 }}>{value}</div>
          </div>
        ))}
      </div>
 
      {/* Toolbar */}
      <div className="admin-filters">
        <div className="search-bar" style={{ flex: 1, maxWidth: '320px' }}>
          <span>⌕</span>
          <input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-input" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ width: '180px' }}>
          <option value="">All Roles</option>
          <option value="user">User</option>
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
              <tr><th>User</th><th>Role</th><th>Status</th><th>Joined</th><th>Last Login</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.filter(u =>
                (!search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())) &&
                (!roleFilter || u.role === roleFilter)
              ).map(user => (
                <tr key={user._id} style={{ opacity: updating === user._id ? 0.6 : 1 }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f0ebe4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.9rem', color: 'var(--maroon)', flexShrink: 0, border: '1px solid #e8e2db' }}>
                        {user.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#1a1917' }}>{user.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#6b665e' }}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <select className="form-input" value={user.role} onChange={e => handleRole(user._id, e.target.value)} disabled={updating === user._id}
                      style={{ padding: '6px 12px', fontSize: '0.75rem', width: '110px' }}>
                      <option value="user">User</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td><span className={`chip chip-${user.status}`}>{user.status}</span></td>
                  <td style={{ fontSize: '0.8rem', color: '#6b665e', fontWeight: '500' }}>
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#6b665e', fontWeight: '500' }}>
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Never'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className={`btn btn-sm ${user.status === 'active' ? 'btn-danger' : 'btn-outline'}`}
                        disabled={updating === user._id} onClick={() => handleStatus(user)} style={{ minWidth: '80px' }}>
                        {user.status === 'active' ? 'Block' : 'Unblock'}
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={() => handleDelete(user._id, user.name)} style={{ padding: '8px 12px' }}>×</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
