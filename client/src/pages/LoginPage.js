import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { loginUser } from '../store';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, user } = useSelector(s => s.auth);
  const [form, setForm] = useState({ email: '', password: '' });

  useEffect(() => {
    if (user) {
      if (['admin', 'staff'].includes(user.role)) navigate('/admin');
      else navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await dispatch(loginUser(form));
    if (res.payload?.user) {
      toast.success(`Welcome back, ${res.payload.user.name.split(' ')[0]}!`);
      if (['admin', 'staff'].includes(res.payload.user.role)) navigate('/admin');
      else navigate('/');
    } else {
      toast.error(res.payload || 'Login failed');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf8f6', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '440px', animation: 'fadeUp 0.5s ease' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: '700', letterSpacing: '0.12em', color: '#4f0c10', marginBottom: '4px' }}>
            MELORAA
          </div>
          <div style={{ fontSize: '0.8rem', color: '#8a8a8a', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Sign In</div>
        </div>

        {/* Card */}
        <div style={{ background: 'white', border: '1px solid #e5e2df', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '32px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '8px', color: '#1a1a1a' }}>Welcome Back</h2>
            <p style={{ color: '#8a8a8a', fontSize: '0.875rem', marginBottom: '28px' }}>Log in to access your account</p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', color: '#8a8a8a', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>Email Address</label>
                <input style={{ width: '100%', padding: '12px 14px', background: 'white', border: '1px solid #e5e2df', borderRadius: '8px', color: '#1a1a1a', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} type="email" placeholder="john@example.com" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', color: '#8a8a8a', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Password</label>
                  <Link to="/forgot-password" style={{ color: '#8a8a8a', textDecoration: 'none', fontSize: '0.75rem' }}>Forgot password?</Link>
                </div>
                <input style={{ width: '100%', padding: '12px 14px', background: 'white', border: '1px solid #e5e2df', borderRadius: '8px', color: '#1a1a1a', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} type="password" placeholder="••••••••" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })} required />
              </div>
              {error && <p style={{ fontSize: '0.8rem', color: '#e05252', marginBottom: '16px' }}>{error}</p>}
              <button type="submit" disabled={loading} style={{ width: '100%', marginTop: '8px', padding: '13px', background: '#4f0c10', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', letterSpacing: '0.03em' }}>
                {loading ? 'Logging in...' : 'Log In'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.875rem' }}>
              <span style={{ color: '#8a8a8a' }}>Don't have an account? </span>
              <Link to="/register" style={{ color: '#4f0c10', textDecoration: 'none', fontWeight: '600' }}>Sign Up</Link>
            </div>
          </div>
        </div>

        {/* Demo hint */}
        <div style={{ marginTop: '16px', background: 'white', border: '1px solid #e5e2df', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: '#8a8a8a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px', fontWeight: '600' }}>Demo Credentials</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#4f0c10', fontWeight: '600' }}>admin@luxestore.com</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#8a8a8a' }}>Admin@123</div>
          </div>
          <button onClick={() => setForm({ email: 'admin@luxestore.com', password: 'Admin@123' })}
            style={{ marginTop: '14px', fontSize: '0.75rem', color: '#4f0c10', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontWeight: '600' }}>
            Fill Credentials
          </button>
        </div>
      </div>
    </div>
  );
}
