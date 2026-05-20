import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/api';

export default function ForgotPasswordPage() {
    const [identifier, setIdentifier] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/auth/forgot-password', { identifier: identifier.trim() });
            setSent(true);
            toast.success(res.data?.message || 'If account exists, password reset instructions have been sent.');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Something went wrong');
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
                    <div style={{ fontSize: '0.8rem', color: '#8a8a8a', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Password Recovery</div>
                </div>

                {/* Card */}
                <div style={{ background: 'white', border: '1px solid #e5e2df', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ padding: '32px' }}>
                        {sent ? (
                            <div style={{ textAlign: 'center', padding: '10px 0' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📬</div>
                                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '12px', color: '#1a1a1a' }}>Check Your Messages / Email</h2>
                                <p style={{ color: '#8a8a8a', fontSize: '0.9rem', marginBottom: '28px', lineHeight: '1.6' }}>
                                    If an account with <strong style={{ color: '#4f0c10' }}>{identifier}</strong> exists, we've sent password reset instructions.
                                </p>
                                <Link to="/login" style={{ display: 'block', width: '100%', padding: '13px', background: '#4f0c10', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', textAlign: 'center', textDecoration: 'none' }}>Back to Login</Link>
                            </div>
                        ) : (
                            <>
                                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '8px', color: '#1a1a1a' }}>Forgot Password?</h2>
                                <p style={{ color: '#8a8a8a', fontSize: '0.875rem', marginBottom: '28px' }}>Enter your email or phone number to receive reset instructions.</p>
                                <form onSubmit={handleSubmit}>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', color: '#8a8a8a', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>Email Address or Phone Number</label>
                                        <input style={{ width: '100%', padding: '12px 14px', background: 'white', border: '1px solid #e5e2df', borderRadius: '8px', color: '#1a1a1a', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} type="text" placeholder="john@example.com or 9876543210" value={identifier}
                                            onChange={e => setIdentifier(e.target.value)} required />
                                    </div>
                                    <button type="submit" disabled={loading} style={{ width: '100%', marginTop: '8px', padding: '13px', background: '#4f0c10', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', letterSpacing: '0.03em' }}>
                                        {loading ? 'Sending instructions...' : 'Send Reset Instructions'}
                                    </button>
                                </form>
                            </>
                        )}
                        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.875rem' }}>
                            <Link to="/login" style={{ color: '#4f0c10', textDecoration: 'none', fontWeight: '600' }}>← Back to Login</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
