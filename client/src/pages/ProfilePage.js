import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { fetchMyOrders, updateProfile, logoutUser, fetchMe, fetchMyReturns, cancelOrder } from '../store';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import api, { authAPI } from '../utils/api';
import '../styles/profile.css';

export default function ProfilePage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, loading: userLoading } = useSelector(s => s.auth);
    const { myOrders, myOrdersPagination, loading: ordersLoading } = useSelector(s => s.orders);
    const { myReturns, loading: returnsLoading } = useSelector(s => s.returns);
    

    const [activeTab, setActiveTab] = useState('dashboard');
    const [profileForm, setProfileForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });

    // Orders Pagination & Filtering State
    const [ordersPage, setOrdersPage] = useState(1);
    const [ordersStatus, setOrdersStatus] = useState('');
    const [ordersSearch, setOrdersSearch] = useState('');
    const [ordersLimit] = useState(10);

    // Address Editing State
    const [editingAddressId, setEditingAddressId] = useState(null);
    const [addressType, setAddressType] = useState(null); // 'billing' or 'shipping'
    const [addressForm, setAddressForm] = useState({
        firstName: '', lastName: '', phone: '', email: '',
        address: '', city: '', state: '', zipCode: '', country: 'India'
    });

    useEffect(() => {
        dispatch(fetchMyOrders({ page: ordersPage, limit: ordersLimit, status: ordersStatus, search: ordersSearch }));
        if (activeTab === 'returns') {
           dispatch(fetchMyReturns());
        }
        if (user) {
            setProfileForm(prev => ({ ...prev, name: user.name, email: user.email }));
        }
    }, [dispatch, user, activeTab, ordersPage, ordersLimit, ordersStatus, ordersSearch]);

    const handleLogout = () => {
        dispatch(logoutUser());
        navigate('/login');
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        if (profileForm.password && profileForm.password !== profileForm.confirmPassword) {
            return toast.error('Passwords do not match');
        }
        const dataToUpdate = { name: profileForm.name, email: profileForm.email };
        if (profileForm.password) dataToUpdate.password = profileForm.password;

        try {
            await dispatch(updateProfile(dataToUpdate)).unwrap();
            toast.success('Profile updated successfully');
            setProfileForm(prev => ({ ...prev, password: '', confirmPassword: '' }));
        } catch (err) {
            toast.error(err || 'Failed to update profile');
        }
    };

    // Address Handlers
    const startEditingAddress = (type) => {
        const existing = user?.addresses?.find(a => a.type === type);
        setAddressType(type);
        if (existing) {
            setEditingAddressId(existing._id);
            setAddressForm({
                firstName: existing.firstName || user.name.split(' ')[0],
                lastName: existing.lastName || user.name.split(' ')[1] || '',
                phone: existing.phone || user.phone || '',
                email: existing.email || user.email,
                address: existing.address || '',
                city: existing.city || '',
                state: existing.state || '',
                zipCode: existing.zipCode || '',
                country: existing.country || 'India'
            });
        } else {
            setEditingAddressId(null);
            setAddressForm({
                firstName: user.name.split(' ')[0],
                lastName: user.name.split(' ')[1] || '',
                phone: user.phone || '',
                email: user.email,
                address: '', city: '', state: '', zipCode: '', country: 'India'
            });
        }
    };

    const handleAddressSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = { ...addressForm, type: addressType };
            if (editingAddressId) {
                await authAPI.updateAddress(editingAddressId, data);
            } else {
                await authAPI.addAddress(data);
            }
            toast.success(`${addressType.charAt(0).toUpperCase() + addressType.slice(1)} address updated`);
            setAddressType(null);
            setEditingAddressId(null);
            dispatch(fetchMe()); // Refresh user data
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update address");
        }
    };

    const getAddress = (type) => user?.addresses?.find(a => a.type === type);
    
    const handleCancelOrder = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this order?')) return;
        try {
            await dispatch(cancelOrder(id)).unwrap();
            toast.success('Order cancelled successfully');
        } catch (err) {
            toast.error(err || 'Failed to cancel order');
        }
    };

    const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <>
            <Header />
            <div className="container" style={{ minHeight: '80vh' }}>
                <div className="profile-container">
                    {/* Sidebar */}
                    <aside className="profile-sidebar">
                        <button className={`profile-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
                        <button className={`profile-nav-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>Orders</button>
                        <button className={`profile-nav-item ${activeTab === 'returns' ? 'active' : ''}`} onClick={() => setActiveTab('returns')}>Returns</button>
                        <button className={`profile-nav-item ${activeTab === 'downloads' ? 'active' : ''}`} onClick={() => setActiveTab('downloads')}>Downloads</button>
                        <button className={`profile-nav-item ${activeTab === 'addresses' ? 'active' : ''}`} onClick={() => setActiveTab('addresses')}>Addresses</button>
                        <button className={`profile-nav-item ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>Account details</button>
                        <button className="profile-nav-item" onClick={handleLogout}>Log out</button>
                    </aside>

                    {/* Main Content */}
                    <main className="profile-content">
                        {activeTab === 'dashboard' && (
                            <div className="profile-welcome">
                                Hello <strong>{user?.name || user?.email?.split('@')[0]}</strong> (not <strong>{user?.name || user?.email?.split('@')[0]}</strong>? <span className="logout" onClick={handleLogout}>Log out</span>)<br /><br />
                                From your account dashboard you can view your recent orders, manage your shipping and billing addresses, and edit your password and account details.
                            </div>
                        )}

                        {activeTab === 'orders' && (
                            <div>
                                <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '30px' }}>Orders</h2>
                                <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' }}>
                                    <input 
                                        type="text" 
                                        placeholder="Search by Order ID or Product Name..." 
                                        className="form-input" 
                                        style={{ flex: '1', minWidth: '250px' }}
                                        value={ordersSearch}
                                        onChange={e => { setOrdersSearch(e.target.value); setOrdersPage(1); }}
                                    />
                                    <select 
                                        className="form-input" 
                                        style={{ width: 'auto', minWidth: '180px' }}
                                        value={ordersStatus} 
                                        onChange={e => { setOrdersStatus(e.target.value); setOrdersPage(1); }}
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="pending">Pending</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="processing">Processing</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                                {ordersLoading ? (
                                    <div className="loading-center"><div className="spinner" /></div>
                                ) : myOrders?.length === 0 ? (
                                    <p>No orders found. <Link to="/" style={{ color: 'var(--gold)' }}>Go to shop</Link></p>
                                ) : (
                                    <>
                                        <table className="orders-table">
                                            <thead>
                                                <tr>
                                                    <th>Order</th>
                                                    <th>Date</th>
                                                    <th>Status</th>
                                                    <th>Total</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {myOrders.map(order => (
                                                    <tr key={order._id}>
                                                        <td style={{ color: 'var(--gold)', fontWeight: '500' }}>#{order._id.substring(0, 8).toUpperCase()}</td>
                                                        <td>{fmtDate(order.createdAt)}</td>
                                                        <td style={{ textTransform: 'capitalize' }}>{order.orderStatus}</td>
                                                        <td>₹{order.total.toLocaleString('en-IN')} for {order.items.length} item(s)</td>
                                                        <td>
                                                            <div className="order-actions">
                                                                <Link to={`/order-confirmation/${order._id}`} className="btn btn-secondary btn-sm" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>VIEW</Link>
                                                                
                                                                {order.canCancel && !['refunded', 'Refund Requested'].includes(order.orderStatus) && !order.canReturn && (
                                                                    <button 
                                                                        className="btn btn-outline btn-sm" 
                                                                        style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: 'var(--red)', color: 'var(--red)' }}
                                                                        onClick={() => handleCancelOrder(order._id)}
                                                                    >
                                                                        CANCEL
                                                                    </button>
                                                                )}

                                                                {order.canReturn && (!order.returnStatus || order.returnStatus === 'none') && (
                                                                    <Link 
                                                                        to={`/request-return?orderId=${order._id}`} 
                                                                        className="btn btn-gold btn-sm" 
                                                                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                                                    >
                                                                        {order.orderStatus === 'delivered' ? 'RETURN / REFUND' : 'REQUEST REFUND'}
                                                                    </Link>
                                                                )}

                                                                {/* Tooltip for blocked actions */}
                                                                {((!order.canCancel && order.cancelReason && order.orderStatus !== 'cancelled') || 
                                                                  (!order.canReturn && order.returnReason && (!order.returnStatus || order.returnStatus === 'none'))) && (
                                                                    <span title={order.cancelReason || order.returnReason} style={{ fontSize: '12px', color: 'var(--muted)', cursor: 'help', marginLeft: '5px' }}>?</span>
                                                                )}

                                                                <a href="https://wa.me/91XXXXXXXXXX" target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>CHAT WITH US</a>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {myOrdersPagination && myOrdersPagination.pages > 1 && (
                                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '30px' }}>
                                                <button 
                                                    className="btn btn-secondary btn-sm" 
                                                    disabled={ordersPage === 1}
                                                    onClick={() => setOrdersPage(p => Math.max(1, p - 1))}
                                                >
                                                    PREV
                                                </button>
                                                <span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
                                                    Page {myOrdersPagination.page} of {myOrdersPagination.pages}
                                                </span>
                                                <button 
                                                    className="btn btn-secondary btn-sm" 
                                                    disabled={ordersPage >= myOrdersPagination.pages}
                                                    onClick={() => setOrdersPage(p => Math.min(myOrdersPagination.pages, p + 1))}
                                                >
                                                    NEXT
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {activeTab === 'returns' && (
                            <div>
                                <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '30px' }}>Your Returns</h2>
                                {returnsLoading ? (
                                    <div className="loading-center"><div className="spinner" /></div>
                                ) : myReturns?.length === 0 ? (
                                    <p>You haven't requested any returns yet.</p>
                                ) : (
                                    <table className="orders-table">
                                        <thead>
                                            <tr>
                                                <th>RMA #</th>
                                                <th>Date</th>
                                                <th>Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {myReturns.map(rma => (
                                                <tr key={rma._id}>
                                                    <td style={{ color: 'var(--gold)', fontWeight: '500', fontFamily: 'var(--font-mono)' }}>{rma.rmaNumber}</td>
                                                    <td>{fmtDate(rma.createdAt)}</td>
                                                    <td><span className={`chip chip-${rma.status}`} style={{ textTransform: 'capitalize' }}>{rma.status.replace(/_/g, ' ')}</span></td>
                                                    <td>
                                                        <Link to={`/returns/${rma._id}`} className="btn btn-secondary btn-sm" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>TRACK</Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}

                        {activeTab === 'addresses' && (
                            <div>
                                {!addressType ? (
                                    <>
                                        <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '20px' }}>Addresses</h2>
                                        <p style={{ color: 'var(--muted)', marginBottom: '40px' }}>The following addresses will be used on the checkout page by default.</p>
                                        <div className="address-grid">
                                            <div className="address-card">
                                                <h3>Billing address <button className="address-edit-link btn-link" onClick={() => startEditingAddress('billing')}>Edit</button></h3>
                                                <div className="address-details">
                                                    {getAddress('billing') ? (
                                                        <>
                                                            {getAddress('billing').firstName} {getAddress('billing').lastName}<br />
                                                            {getAddress('billing').address}<br />
                                                            {getAddress('billing').city}, {getAddress('billing').state} {getAddress('billing').zipCode}<br />
                                                            {getAddress('billing').phone}
                                                        </>
                                                    ) : (
                                                        <>
                                                            {user?.name}<br />
                                                            No billing address set yet.
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="address-card">
                                                <h3>Shipping address <button className="address-edit-link btn-link" onClick={() => startEditingAddress('shipping')}>Edit</button></h3>
                                                <div className="address-details">
                                                    {getAddress('shipping') ? (
                                                        <>
                                                            {getAddress('shipping').firstName} {getAddress('shipping').lastName}<br />
                                                            {getAddress('shipping').address}<br />
                                                            {getAddress('shipping').city}, {getAddress('shipping').state} {getAddress('shipping').zipCode}<br />
                                                            {getAddress('shipping').phone}
                                                        </>
                                                    ) : (
                                                        <>
                                                            {user?.name}<br />
                                                            No shipping address set yet.
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="card" style={{ maxWidth: '700px', border: 'none', background: 'transparent' }}>
                                        <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '30px' }}>{addressType.charAt(0).toUpperCase() + addressType.slice(1)} address</h2>
                                        <form onSubmit={handleAddressSubmit}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                                <div className="form-group">
                                                    <label className="form-label">First name *</label>
                                                    <input className="form-input" type="text" value={addressForm.firstName} onChange={e => setAddressForm({ ...addressForm, firstName: e.target.value })} required />
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label">Last name *</label>
                                                    <input className="form-input" type="text" value={addressForm.lastName} onChange={e => setAddressForm({ ...addressForm, lastName: e.target.value })} required />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">Street address *</label>
                                                <input className="form-input" type="text" placeholder="House number and street name" value={addressForm.address} onChange={e => setAddressForm({ ...addressForm, address: e.target.value })} required />
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                                                <div className="form-group">
                                                    <label className="form-label">Town / City *</label>
                                                    <input className="form-input" type="text" value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city: e.target.value })} required />
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label">State *</label>
                                                    <input className="form-input" type="text" value={addressForm.state} onChange={e => setAddressForm({ ...addressForm, state: e.target.value })} required />
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label">PIN Code *</label>
                                                    <input className="form-input" type="text" value={addressForm.zipCode} onChange={e => setAddressForm({ ...addressForm, zipCode: e.target.value })} required />
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                                <div className="form-group">
                                                    <label className="form-label">Phone *</label>
                                                    <input className="form-input" type="text" value={addressForm.phone} onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })} required />
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label">Email address *</label>
                                                    <input className="form-input" type="email" value={addressForm.email} onChange={e => setAddressForm({ ...addressForm, email: e.target.value })} required />
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                                                <button type="submit" className="btn btn-gold" style={{ padding: '12px 30px' }}>SAVE ADDRESS</button>
                                                <button type="button" className="btn btn-secondary" onClick={() => setAddressType(null)} style={{ padding: '12px 30px' }}>CANCEL</button>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'details' && (
                            <div className="card" style={{ maxWidth: '700px', border: 'none', background: 'transparent' }}>
                                <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '30px' }}>Account details</h2>
                                <form onSubmit={handleProfileUpdate}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div className="form-group">
                                            <label className="form-label">Full Name *</label>
                                            <input className="form-input" type="text" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Email Address *</label>
                                            <input className="form-input" type="text" value={profileForm.email} disabled />
                                        </div>
                                    </div>

                                    <h3 style={{ margin: '40px 0 20px', fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>Password change</h3>

                                    <div className="form-group">
                                        <label className="form-label">New password (leave blank to leave unchanged)</label>
                                        <input className="form-input" type="password" value={profileForm.password} onChange={e => setProfileForm({ ...profileForm, password: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Confirm new password</label>
                                        <input className="form-input" type="password" value={profileForm.confirmPassword} onChange={e => setProfileForm({ ...profileForm, confirmPassword: e.target.value })} />
                                    </div>

                                    <button type="submit" className="btn btn-gold" disabled={userLoading} style={{ marginTop: '20px', padding: '12px 30px' }}>
                                        {userLoading ? <span className="spinner" /> : 'SAVE CHANGES'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {activeTab === 'downloads' && (
                            <div>
                                <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '30px' }}>Downloads</h2>
                                <div style={{ background: 'var(--ink-mid)', padding: '20px', border: '1px solid var(--gold)', borderLeftWidth: '5px' }}>
                                    No downloads available yet. <Link to="/" style={{ color: 'var(--gold)', fontWeight: 'bold' }}>BROWSE PRODUCTS</Link>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </>
    );
}
