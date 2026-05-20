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
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf8f6', padding: '24px' }}>
            <div style={{ width: '100%', maxWidth: '440px', animation: 'fadeUp 0.5s ease' }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: '700', letterSpacing: '0.12em', color: '#4f0c10', marginBottom: '4px' }}>
                        MELORAA
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#8a8a8a', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Set New Password</div>
                </div>

                {/* Card */}
                <div style={{ background: 'white', border: '1px solid #e5e2df', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ padding: '32px' }}>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '8px', color: '#1a1a1a' }}>Reset Password</h2>
                        <p style={{ color: '#8a8a8a', fontSize: '0.875rem', marginBottom: '28px' }}>Enter your new password below.</p>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', color: '#8a8a8a', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>New Password</label>
                                <input style={{ width: '100%', padding: '12px 14px', background: 'white', border: '1px solid #e5e2df', borderRadius: '8px', color: '#1a1a1a', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} type="password" placeholder="••••••••" value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })} required />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', color: '#8a8a8a', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>Confirm New Password</label>
                                <input style={{ width: '100%', padding: '12px 14px', background: 'white', border: '1px solid #e5e2df', borderRadius: '8px', color: '#1a1a1a', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} type="password" placeholder="••••••••" value={form.confirmPassword}
                                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />
                            </div>
                            <button type="submit" disabled={loading} style={{ width: '100%', marginTop: '8px', padding: '13px', background: '#4f0c10', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', letterSpacing: '0.03em' }}>
                                {loading ? 'Resetting password...' : 'Reset Password'}
                            </button>
                        </form>
                        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.875rem' }}>
                            <Link to="/login" style={{ color: '#4f0c10', textDecoration: 'none', fontWeight: '600' }}>← Back to Login</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
