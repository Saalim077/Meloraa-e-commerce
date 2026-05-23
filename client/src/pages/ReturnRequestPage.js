import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { orderAPI, returnAPI, uploadAPI } from '../utils/api';
import { createReturn } from '../store';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/return-request.css';

const STEPS = ['Select Items', 'Request Details', 'Review & Submit'];

export default function ReturnRequestPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);

  const [step, setStep] = useState(1);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eligibility, setEligibility] = useState({ eligible: true });

  // Form State
  const [selectedItems, setSelectedItems] = useState([]); // [{ orderItem, product, quantity, condition, price }]
  const [returnType, setReturnType] = useState('return');
  const [reason, setReason] = useState('changed_mind');
  const [reasonDetails, setReasonDetails] = useState('');
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [refundMethod, setRefundMethod] = useState('original_payment');
  const [pickupAddress, setPickupAddress] = useState(null);
  const [addressSource, setAddressSource] = useState('shipping');
  const [otherAddress, setOtherAddress] = useState({
    firstName: '',
    lastName: '',
    addressLine1: '',
    city: '',
    state: '',
    pincode: ''
  });

  useEffect(() => {
    if (!orderId) {
      toast.error('No order ID provided');
      navigate('/profile');
      return;
    }

    const load = async () => {
      try {
        const [orderRes, eligRes] = await Promise.all([
          orderAPI.getOne(orderId),
          returnAPI.getEligibility(orderId)
        ]);
        setOrder(orderRes.data.order);
        setEligibility(eligRes.data);
        
        // Ensure default returnType is eligible
        if (eligRes.data.eligibility) {
          if (!eligRes.data.eligibility['return']?.eligible) {
            const firstEligible = ['refund', 'exchange', 'return'].find(t => eligRes.data.eligibility[t]?.eligible);
            if (firstEligible) setReturnType(firstEligible);
          }
        }
        if (user && user.addresses?.length > 0) {
          // Default to shipping address from order if available
          setPickupAddress(orderRes.data.order.shippingAddress);
        } else {
          setPickupAddress(orderRes.data.order.shippingAddress);
        }
      } catch (err) {
        toast.error('Failed to load order details');
        navigate('/profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orderId, navigate, user]);

  const toggleItem = (item) => {
    const idx = selectedItems.findIndex(i => i.orderItem === item._id);
    if (idx > -1) {
      setSelectedItems(selectedItems.filter(i => i.orderItem !== item._id));
    } else {
      setSelectedItems([...selectedItems, {
        orderItem: item._id,
        product: item.product._id,
        quantity: item.quantity,
        condition: 'unopened',
        price: item.price,
        name: item.product.name,
        image: item.product.images?.[0]
      }]);
    }
  };

  const updateItemQty = (id, qty) => {
    setSelectedItems(selectedItems.map(i => i.orderItem === id ? { ...i, quantity: qty } : i));
  };

  const updateItemCondition = (id, cond) => {
    setSelectedItems(selectedItems.map(i => i.orderItem === id ? { ...i, condition: cond } : i));
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (photos.length + files.length > 4) {
      toast.error('Max 4 photos allowed');
      return;
    }

    setUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('image', file);
        const res = await uploadAPI.upload(formData);
        setPhotos(prev => [...prev, res.data.url]);
      }
    } catch (err) {
      toast.error('Photo upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (url) => {
    setPhotos(photos.filter(p => p !== url));
  };

  const handleSubmit = async () => {
    const finalPickupAddress = addressSource === 'other' ? otherAddress : 
                               addressSource === 'shipping' ? order.shippingAddress :
                               addressSource === 'billing' ? (order.billingAddress || order.shippingAddress) :
                               pickupAddress;

    const payload = {
      orderId,
      type: returnType,
      reason,
      reasonDetails,
      items: selectedItems.map(({ orderItem, product, quantity, condition, price }) => ({
        orderItem, product, quantity, condition, price
      })),
      photos,
      refundMethod,
      pickupAddress: finalPickupAddress
    };

    setLoading(true);
    try {
      const res = await dispatch(createReturn(payload)).unwrap();
      toast.success('Return request submitted successfully');
      navigate(`/returns/${res.rma._id}`);
    } catch (err) {
      toast.error(err || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner spinner-lg" /></div>;

  if (!eligibility.eligible) {
    return (
      <>
        <Header />
        <div className="return-container" style={{ maxWidth: '600px', padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '24px' }}>⚠️</div>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--maroon)', fontSize: '2rem', marginBottom: '16px' }}>Not Eligible for Return</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '32px' }}>{eligibility.reason}</p>
          <button className="btn btn-outline" onClick={() => navigate('/profile')}>Back to My Orders</button>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="return-container">
        <div className="return-header">
          <h1>Request Return</h1>
          <p>Order #{order?.orderNumber}</p>
        </div>

        {/* Progress Bar */}
        <div className="return-stepper">
          <div className="return-stepper-line" />
          <div className="return-stepper-progress" style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }} />
          {STEPS.map((s, i) => {
            const isCompleted = step > i + 1;
            const isActive = step === i + 1;
            return (
              <div key={s} className={`return-step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                <div className="return-step-circle">
                  {isCompleted ? '✓' : i + 1}
                </div>
                <div className="return-step-label">{s}</div>
              </div>
            );
          })}
        </div>

        {/* Step 1: Select Items */}
        {step === 1 && (
          <div className="step-content animate-fade-in">
            <div className="return-card">
              <h3 className="return-card-title">Which items would you like to return?</h3>
              <div className="return-items-stack">
                {order?.items.map(item => {
                  const isSelected = selectedItems.find(i => i.orderItem === item._id);
                  return (
                    <div 
                      key={item._id} 
                      onClick={() => toggleItem(item)} 
                      className={`return-item-row ${isSelected ? 'selected' : ''}`}
                    >
                      <div className="return-checkbox">
                        {isSelected && <span className="return-checkbox-tick">✓</span>}
                      </div>
                      <img src={item.product.images?.[0]} alt="" className="return-item-thumb" />
                      <div className="return-item-details">
                        <div className="return-item-name">{item.product.name}</div>
                        <div className="return-item-meta">Qty: {item.quantity} • ₹{item.price.toLocaleString('en-IN')}</div>
                      </div>
                      {isSelected && (
                        <div onClick={e => e.stopPropagation()} className="return-item-inputs">
                          <select 
                            value={isSelected.quantity} 
                            onChange={e => updateItemQty(item._id, Number(e.target.value))} 
                            className="return-select" 
                            style={{ width: '64px' }}
                          >
                            {[...Array(item.quantity)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                          </select>
                          <select 
                            value={isSelected.condition} 
                            onChange={e => updateItemCondition(item._id, e.target.value)} 
                            className="return-select" 
                            style={{ width: '120px' }}
                          >
                            <option value="unopened">Unopened</option>
                            <option value="opened">Opened</option>
                            <option value="damaged">Damaged</option>
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="return-actions-row" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-gold" disabled={selectedItems.length === 0} onClick={() => setStep(2)}>Continue</button>
            </div>
          </div>
        )}

        {/* Step 2: Request Details */}
        {step === 2 && (
          <div className="step-content animate-fade-in">
            <div className="return-card">
              <h3 className="return-card-title">What would you like to do?</h3>
              <div className="return-type-grid">
                {[
                  { id: 'return', title: 'Return & Refund', desc: 'Get your money back' },
                  { id: 'exchange', title: 'Exchange', desc: 'Swap for another size/item' },
                  { id: 'refund', title: 'Refund Only', desc: 'For missing/damaged items' }
                ].map(t => {
                  const isEligible = eligibility.eligibility?.[t.id]?.eligible !== false;
                  const reason = eligibility.eligibility?.[t.id]?.reason;
                  const isSelected = returnType === t.id;
                  
                  return (
                    <div key={t.id} 
                      onClick={() => isEligible && setReturnType(t.id)} 
                      className={`return-type-card ${isSelected ? 'selected' : ''} ${!isEligible ? 'disabled' : ''}`}
                      title={!isEligible ? reason : ''}
                    >
                      <div className="return-type-title">{t.title}</div>
                      <div className="return-type-desc">{t.desc}</div>
                      {!isEligible && <div className="return-type-blocked">Blocked by store policy</div>}
                    </div>
                  );
                })}
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Reason for Return</label>
                <select value={reason} onChange={e => setReason(e.target.value)} className="form-input return-select" style={{ width: '100%', paddingRight: '40px', backgroundPosition: 'right 16px center', backgroundSize: '16px' }}>
                  <option value="defective">Defective product</option>
                  <option value="wrong_item">Wrong item sent</option>
                  <option value="not_as_described">Not as described</option>
                  <option value="size_issue">Size/fit issue</option>
                  <option value="changed_mind">Changed my mind</option>
                  <option value="damaged_in_transit">Damaged in transit</option>
                  <option value="missing_parts">Missing parts</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Additional Details</label>
                <textarea value={reasonDetails} onChange={e => setReasonDetails(e.target.value)} className="form-input" rows="3" placeholder="Tell us more about the issue..." style={{ padding: '12px 16px', minHeight: '100px', resize: 'vertical' }} />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Photos (Optional)</label>
                <div className="return-upload-grid">
                  {photos.map(p => (
                    <div key={p} className="return-photo-card">
                      <img src={p} alt="" />
                      <button onClick={() => removePhoto(p)} className="return-photo-remove">×</button>
                    </div>
                  ))}
                  {photos.length < 4 && (
                    <label className="return-upload-trigger">
                      <span className="return-upload-icon">{uploading ? '⌛' : '+'}</span>
                      <span>Upload</span>
                      <input type="file" multiple hidden onChange={handlePhotoUpload} accept="image/*" />
                    </label>
                  )}
                </div>
              </div>

              {returnType !== 'exchange' && (
                <div className="form-group" style={{ marginBottom: '32px' }}>
                  <label className="form-label">Preferred Refund Method</label>
                  <div className="return-refund-row">
                    {[
                      { id: 'original_payment', label: 'Original Payment' },
                      { id: 'store_credit', label: 'Store Credit (+5% Bonus)' },
                      { id: 'bank_transfer', label: 'Bank Transfer' }
                    ].map(m => (
                      <div key={m.id} 
                        onClick={() => setRefundMethod(m.id)} 
                        className={`return-refund-card ${refundMethod === m.id ? 'selected' : ''}`}
                      >
                        {m.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Address Selector */}
              <div className="form-group">
                <label className="form-label">Pickup Address Selection</label>
                <div className="return-address-sources">
                  <button 
                    type="button"
                    className={`return-address-btn ${addressSource === 'shipping' ? 'active' : ''}`}
                    onClick={() => setAddressSource('shipping')}
                  >
                    Shipping Address
                  </button>
                  <button 
                    type="button"
                    className={`return-address-btn ${addressSource === 'billing' ? 'active' : ''}`}
                    onClick={() => setAddressSource('billing')}
                  >
                    Billing Address
                  </button>
                  <button 
                    type="button"
                    className={`return-address-btn ${addressSource === 'saved' ? 'active' : ''}`}
                    onClick={() => setAddressSource('saved')}
                    disabled={!user?.addresses?.length}
                  >
                    Saved Address
                  </button>
                  <button 
                    type="button"
                    className={`return-address-btn ${addressSource === 'other' ? 'active' : ''}`}
                    onClick={() => setAddressSource('other')}
                  >
                    New Address
                  </button>
                </div>

                {addressSource === 'saved' && (
                  <div style={{ marginBottom: '16px' }}>
                    <select 
                      className="form-input return-select" 
                      value={user?.addresses?.findIndex(a => JSON.stringify(a) === JSON.stringify(pickupAddress))}
                      onChange={e => setPickupAddress(user.addresses[e.target.value])}
                      style={{ width: '100%', paddingRight: '40px', backgroundPosition: 'right 16px center', backgroundSize: '16px' }}
                    >
                      {user?.addresses?.map((a, i) => (
                        <option key={i} value={i}>{a.addressLine1}, {a.city}</option>
                      ))}
                    </select>
                  </div>
                )}

                {addressSource === 'other' && (
                  <div className="return-new-address-form" style={{ marginBottom: '16px' }}>
                    <input 
                      className="form-input" 
                      placeholder="First Name" 
                      value={otherAddress.firstName} 
                      onChange={e => setOtherAddress({...otherAddress, firstName: e.target.value})} 
                    />
                    <input 
                      className="form-input" 
                      placeholder="Last Name" 
                      value={otherAddress.lastName} 
                      onChange={e => setOtherAddress({...otherAddress, lastName: e.target.value})} 
                    />
                    <input 
                      className="form-input" 
                      style={{ gridColumn: 'span 2' }} 
                      placeholder="Address Line 1" 
                      value={otherAddress.addressLine1} 
                      onChange={e => setOtherAddress({...otherAddress, addressLine1: e.target.value})} 
                    />
                    <input 
                      className="form-input" 
                      placeholder="City" 
                      value={otherAddress.city} 
                      onChange={e => setOtherAddress({...otherAddress, city: e.target.value})} 
                    />
                    <input 
                      className="form-input" 
                      placeholder="State" 
                      value={otherAddress.state} 
                      onChange={e => setOtherAddress({...otherAddress, state: e.target.value})} 
                    />
                    <input 
                      className="form-input" 
                      style={{ gridColumn: 'span 2' }}
                      placeholder="Pincode" 
                      value={otherAddress.pincode} 
                      onChange={e => setOtherAddress({...otherAddress, pincode: e.target.value})} 
                    />
                  </div>
                )}

                {addressSource === 'shipping' && order && (
                  <div className="return-address-preview">
                    <strong>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</strong>
                    {order.shippingAddress.address}<br/>
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                  </div>
                )}

                {addressSource === 'billing' && order && (
                  <div className="return-address-preview">
                    <strong>{order.billingAddress?.firstName || order.shippingAddress.firstName} {order.billingAddress?.lastName || order.shippingAddress.lastName}</strong>
                    {order.billingAddress?.address || order.shippingAddress.address}<br/>
                    {order.billingAddress?.city || order.shippingAddress.city}, {order.billingAddress?.state || order.shippingAddress.state} {order.billingAddress?.zipCode || order.shippingAddress.zipCode}
                  </div>
                )}

                {addressSource === 'saved' && pickupAddress && (
                  <div className="return-address-preview">
                    <strong>{pickupAddress.firstName || user?.name} {pickupAddress.lastName}</strong>
                    {pickupAddress.addressLine1}<br/>
                    {pickupAddress.city}, {pickupAddress.state} {pickupAddress.pincode}
                  </div>
                )}
              </div>
            </div>
            <div className="return-actions-row">
              <button className="btn btn-outline" onClick={() => setStep(1)}>Back</button>
              <button className="btn btn-gold" onClick={() => setStep(3)}>Review Request</button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Submit */}
        {step === 3 && (
          <div className="step-content animate-fade-in">
            <div className="return-card">
              <h3 className="return-card-title">Review Your Request</h3>
              
              <div style={{ marginBottom: '28px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700' }}>Items to Return</div>
                <div className="return-review-list">
                  {selectedItems.map(item => (
                    <div key={item.orderItem} className="return-review-item">
                      <img src={item.image} alt="" className="return-review-thumb" />
                      <div className="return-review-info">
                        <strong>{item.quantity}x</strong> {item.name}
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Condition: <span style={{ textTransform: 'capitalize' }}>{item.condition}</span></div>
                      </div>
                      <div className="return-review-price">₹{(item.price * item.quantity).toLocaleString('en-IN')}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="return-review-grid">
                <div>
                  <div className="return-review-label">Return Type</div>
                  <div className="return-review-value highlight">{returnType.toUpperCase()}</div>
                </div>
                <div>
                  <div className="return-review-label">Reason</div>
                  <div className="return-review-value" style={{ textTransform: 'capitalize' }}>{reason.replace(/_/g, ' ')}</div>
                </div>
                <div>
                  <div className="return-review-label">Estimated Refund</div>
                  <div className="return-review-value" style={{ color: 'var(--maroon)', fontWeight: '700' }}>₹{selectedItems.reduce((acc, i) => acc + (i.price * i.quantity), 0).toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div className="return-review-label">Refund Method</div>
                  <div className="return-review-value" style={{ textTransform: 'capitalize' }}>{refundMethod.replace(/_/g, ' ')}</div>
                </div>
              </div>

              <div style={{ marginBottom: '28px' }}>
                <div className="return-review-label" style={{ fontWeight: '700', marginBottom: '8px' }}>Pickup Address</div>
                <div className="return-address-preview">
                  {addressSource === 'shipping' && order && (
                    <>
                      <strong>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</strong>
                      {order.shippingAddress.address}<br/>
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                    </>
                  )}
                  {addressSource === 'billing' && order && (
                    <>
                      <strong>{order.billingAddress?.firstName || order.shippingAddress.firstName} {order.billingAddress?.lastName || order.shippingAddress.lastName}</strong>
                      {order.billingAddress?.address || order.shippingAddress.address}<br/>
                      {order.billingAddress?.city || order.shippingAddress.city}, {order.billingAddress?.state || order.shippingAddress.state} {order.billingAddress?.zipCode || order.shippingAddress.zipCode}
                    </>
                  )}
                  {addressSource === 'saved' && pickupAddress && (
                    <>
                      <strong>{pickupAddress.firstName || user?.name} {pickupAddress.lastName}</strong>
                      {pickupAddress.addressLine1}<br/>
                      {pickupAddress.city}, {pickupAddress.state} {pickupAddress.pincode}
                    </>
                  )}
                  {addressSource === 'other' && (
                    <>
                      <strong>{otherAddress.firstName} {otherAddress.lastName}</strong>
                      {otherAddress.addressLine1}<br/>
                      {otherAddress.city}, {otherAddress.state} {otherAddress.pincode}
                    </>
                  )}
                </div>
              </div>

              <div className="return-policy-alert">
                <div className="return-policy-title">Returns Policy Notice</div>
                <p className="return-policy-text">
                  We want you to love every LuxeStore purchase. If you're not completely satisfied, you may return most items within 7 days of delivery. 
                  Items must be unused, unworn, and in original packaging. Refunds are processed within 5–7 business days.
                </p>
              </div>
            </div>
            <div className="return-actions-row">
              <button className="btn btn-outline" onClick={() => setStep(2)}>Back</button>
              <button className="btn btn-gold" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Return Request'}
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
