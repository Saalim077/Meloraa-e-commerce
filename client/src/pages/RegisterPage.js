import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { registerUser } from '../store';

export default function RegisterPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error, user } = useSelector(s => s.auth);
    const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });

    useEffect(() => {
        // If already logged in, redirect
        if (user) {
            if (['admin', 'staff'].includes(user.role)) navigate('/admin');
            else navigate('/');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        const { confirmPassword, ...registerData } = form;
        const res = await dispatch(registerUser(registerData));

        if (res.payload?.user) {
            toast.success(`Welcome to MELORAA, ${res.payload.user.name.split(' ')[0]}!`);
            navigate('/');
        } else {
            toast.error(res.payload || 'Registration failed');
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
                    <div style={{ fontSize: '0.8rem', color: '#8a8a8a', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Create Account</div>
                </div>

                {/* Card */}
                <div style={{ background: 'white', border: '1px solid #e5e2df', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ padding: '32px' }}>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '8px', color: '#1a1a1a' }}>Sign Up</h2>
                        <p style={{ color: '#8a8a8a', fontSize: '0.875rem', marginBottom: '28px' }}>Join MELORAA for exclusive fashion.</p>

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', color: '#8a8a8a', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>Full Name</label>
                                <input style={{ width: '100%', padding: '12px 14px', background: 'white', border: '1px solid #e5e2df', borderRadius: '8px', color: '#1a1a1a', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} type="text" placeholder="John Doe" value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', color: '#8a8a8a', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>Email Address</label>
                                <input style={{ width: '100%', padding: '12px 14px', background: 'white', border: '1px solid #e5e2df', borderRadius: '8px', color: '#1a1a1a', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} type="email" placeholder="john@example.com" value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })} required />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', color: '#8a8a8a', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>Password</label>
                                <input style={{ width: '100%', padding: '12px 14px', background: 'white', border: '1px solid #e5e2df', borderRadius: '8px', color: '#1a1a1a', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} type="password" placeholder="••••••••" value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })} required />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', color: '#8a8a8a', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>Confirm Password</label>
                                <input style={{ width: '100%', padding: '12px 14px', background: 'white', border: '1px solid #e5e2df', borderRadius: '8px', color: '#1a1a1a', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} type="password" placeholder="••••••••" value={form.confirmPassword}
                                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />
                            </div>

                            {error && <p style={{ fontSize: '0.8rem', color: '#e05252', marginBottom: '16px' }}>{error}</p>}

                            <button type="submit" disabled={loading} style={{ width: '100%', marginTop: '8px', padding: '13px', background: '#4f0c10', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', letterSpacing: '0.03em' }}>
                                {loading ? 'Creating account...' : 'Create Account'}
                            </button>
                        </form>

                        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.875rem' }}>
                            <span style={{ color: '#8a8a8a' }}>Already have an account? </span>
                            <Link to="/login" style={{ color: '#4f0c10', textDecoration: 'none', fontWeight: '600' }}>Sign In</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
