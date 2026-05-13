import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/api';

export default function ResetPasswordPage() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState({ password: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) {
            return toast.error('Passwords do not match');
        }
        setLoading(true);
        try {
            await api.put(`/auth/reset-password/${token}`, { password: form.password });
            toast.success('Password reset successful! Please log in.');
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid or expired reset token');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ink)', padding: '24px' }}>
            <div style={{ width: '100%', maxWidth: '420px', animation: 'fadeUp 0.5s ease' }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: '700', letterSpacing: '0.1em', color: 'var(--gold)', marginBottom: '4px' }}>LUXESTORE</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Set New Password</div>
                </div>

                <div className="card">
                    <div className="card-body">
                        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '8px' }}>Reset Password</h2>
                        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '28px' }}>Enter your new password below.</p>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">New Password</label>
                                <input className="form-input" type="password" placeholder="••••••••" value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Confirm New Password</label>
                                <input className="form-input" type="password" placeholder="••••••••" value={form.confirmPassword}
                                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />
                            </div>
                            <button type="submit" className="btn btn-gold btn-full" disabled={loading} style={{ marginTop: '8px', padding: '12px' }}>
                                {loading ? <span className="spinner" /> : 'Reset Password'}
                            </button>
                        </form>
                        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.875rem' }}>
                            <Link to="/login" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: '500' }}>← Back to Login</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
