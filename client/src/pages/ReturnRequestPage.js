import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { orderAPI, returnAPI, uploadAPI } from '../utils/api';
import { createReturn } from '../store';

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
      <div className="container" style={{ maxWidth: '600px', padding: '80px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
        <h2 style={{ fontFamily: 'var(--font-serif)', marginBottom: '12px' }}>Not Eligible for Return</h2>
        <p style={{ color: 'var(--muted)', lineHeight: '1.6', marginBottom: '32px' }}>{eligibility.reason}</p>
        <button className="btn btn-outline" onClick={() => navigate('/profile')}>Back to My Orders</button>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '800px', padding: '40px 20px' }}>
      <div className="page-header" style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', marginBottom: '8px' }}>Request Return</h1>
        <p style={{ color: 'var(--muted)' }}>Order #{order?.orderNumber}</p>
      </div>

      {/* Progress Bar */}
      <div className="progress-steps" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '60px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '15px', left: '0', right: '0', height: '2px', background: '#2e2c29', zIndex: '0' }} />
        <div style={{ position: 'absolute', top: '15px', left: '0', width: `${((step - 1) / (STEPS.length - 1)) * 100}%`, height: '2px', background: 'var(--gold)', zIndex: '0', transition: '0.3s ease' }} />
        {STEPS.map((s, i) => (
          <div key={s} style={{ zIndex: '1', textAlign: 'center', width: '33.33%' }}>
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '50%', background: step > i + 1 ? 'var(--gold)' : step === i + 1 ? 'var(--bg-card)' : 'var(--bg)',
              border: `2px solid ${step >= i + 1 ? 'var(--gold)' : '#2e2c29'}`,
              color: step > i + 1 ? '#000' : step === i + 1 ? 'var(--gold)' : 'var(--muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px',
              fontSize: '14px', fontWeight: '700'
            }}>
              {step > i + 1 ? '✓' : i + 1}
            </div>
            <div style={{ fontSize: '12px', fontWeight: step === i + 1 ? '600' : '400', color: step >= i + 1 ? 'var(--text)' : 'var(--muted)' }}>{s}</div>
          </div>
        ))}
      </div>

      {/* Step 1: Select Items */}
      {step === 1 && (
        <div className="step-content animate-fade-in">
          <div className="card" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>Which items would you like to return?</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {order?.items.map(item => {
                const isSelected = selectedItems.find(i => i.orderItem === item._id);
                return (
                  <div key={item._id} onClick={() => toggleItem(item)} style={{ 
                    display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', border: `1px solid ${isSelected ? 'var(--gold)' : '#2e2c29'}`, 
                    borderRadius: '8px', cursor: 'pointer', background: isSelected ? 'rgba(201, 168, 76, 0.05)' : 'transparent', transition: '0.2s'
                  }}>
                    <div style={{ width: '20px', height: '20px', border: '2px solid var(--gold)', borderRadius: '4px', background: isSelected ? 'var(--gold)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isSelected && <span style={{ color: '#000', fontSize: '14px' }}>✓</span>}
                    </div>
                    <img src={item.product.images?.[0]} alt="" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', fontSize: '14px' }}>{item.product.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Qty: {item.quantity} • ₹{item.price.toLocaleString('en-IN')}</div>
                    </div>
                    {isSelected && (
                      <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select value={isSelected.quantity} onChange={e => updateItemQty(item._id, Number(e.target.value))} className="form-input" style={{ width: '60px', padding: '4px' }}>
                          {[...Array(item.quantity)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                        </select>
                        <select value={isSelected.condition} onChange={e => updateItemCondition(item._id, e.target.value)} className="form-input" style={{ width: '100px', padding: '4px' }}>
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
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-gold" disabled={selectedItems.length === 0} onClick={() => setStep(2)}>Continue</button>
          </div>
        </div>
      )}

      {/* Step 2: Request Details */}
      {step === 2 && (
        <div className="step-content animate-fade-in">
          <div className="card" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>What would you like to do?</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '32px' }}>
              {[
                { id: 'return', title: 'Return & Refund', desc: 'Get your money back' },
                { id: 'exchange', title: 'Exchange', desc: 'Swap for another size/item' },
                { id: 'refund', title: 'Refund Only', desc: 'For missing/damaged items' }
              ].map(t => {
                const isEligible = eligibility.eligibility?.[t.id]?.eligible !== false;
                const reason = eligibility.eligibility?.[t.id]?.reason;
                
                return (
                  <div key={t.id} 
                    onClick={() => isEligible && setReturnType(t.id)} 
                    style={{ 
                      padding: '16px', textAlign: 'center', 
                      border: `1px solid ${returnType === t.id ? 'var(--gold)' : '#2e2c29'}`, 
                      borderRadius: '8px', cursor: isEligible ? 'pointer' : 'not-allowed', 
                      background: returnType === t.id ? 'rgba(201, 168, 76, 0.05)' : 'transparent',
                      opacity: isEligible ? 1 : 0.5,
                      position: 'relative'
                    }}
                    title={!isEligible ? reason : ''}
                  >
                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>{t.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{t.desc}</div>
                    {!isEligible && <div style={{ fontSize: '9px', color: 'var(--red)', marginTop: '4px', fontStyle: 'italic' }}>Blocked by store policy</div>}
                  </div>
                );
              })}
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Reason for Return</label>
              <select value={reason} onChange={e => setReason(e.target.value)} className="form-input">
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
              <textarea value={reasonDetails} onChange={e => setReasonDetails(e.target.value)} className="form-input" rows="3" placeholder="Tell us more about the issue..." />
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Photos (Optional)</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                {photos.map(p => (
                  <div key={p} style={{ position: 'relative', aspectRatio: '1/1', border: '1px solid #2e2c29', borderRadius: '4px', overflow: 'hidden' }}>
                    <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button onClick={() => removePhoto(p)} style={{ position: 'absolute', top: '2px', right: '2px', background: '#e54b4b', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '12px', cursor: 'pointer' }}>×</button>
                  </div>
                ))}
                {photos.length < 4 && (
                  <label style={{ 
                    aspectRatio: '1/1', border: '2px dashed #2e2c29', borderRadius: '4px', display: 'flex', flexDirection: 'column', 
                    alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted)', fontSize: '11px' 
                  }}>
                    <span style={{ fontSize: '20px' }}>{uploading ? '⌛' : '+'}</span>
                    <span>Upload</span>
                    <input type="file" multiple hidden onChange={handlePhotoUpload} accept="image/*" />
                  </label>
                )}
              </div>
            </div>

            {returnType !== 'exchange' && (
              <div className="form-group">
                <label className="form-label">Preferred Refund Method</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {[
                    { id: 'original_payment', label: 'Original Payment' },
                    { id: 'store_credit', label: 'Store Credit (+5% Bonus)' },
                    { id: 'bank_transfer', label: 'Bank Transfer' }
                  ].map(m => (
                    <div key={m.id} onClick={() => setRefundMethod(m.id)} style={{ 
                      flex: 1, padding: '12px', textAlign: 'center', border: `1px solid ${refundMethod === m.id ? 'var(--gold)' : '#2e2c29'}`, 
                      borderRadius: '8px', cursor: 'pointer', fontSize: '12px', background: refundMethod === m.id ? 'rgba(201, 168, 76, 0.05)' : 'transparent'
                    }}>
                      {m.label}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Address Selector */}
            <div className="form-group" style={{ marginTop: '24px' }}>
              <label className="form-label">Pickup Address Selection</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <button 
                  type="button"
                  className={`btn btn-sm ${addressSource === 'shipping' ? 'btn-gold' : 'btn-outline'}`}
                  onClick={() => setAddressSource('shipping')}
                  style={{ fontSize: '12px' }}
                >
                  Shipping Address
                </button>
                <button 
                  type="button"
                  className={`btn btn-sm ${addressSource === 'billing' ? 'btn-gold' : 'btn-outline'}`}
                  onClick={() => setAddressSource('billing')}
                  style={{ fontSize: '12px' }}
                >
                  Billing Address
                </button>
                <button 
                  type="button"
                  className={`btn btn-sm ${addressSource === 'saved' ? 'btn-gold' : 'btn-outline'}`}
                  onClick={() => setAddressSource('saved')}
                  style={{ fontSize: '12px' }}
                  disabled={!user.addresses?.length}
                >
                  Saved Address
                </button>
                <button 
                  type="button"
                  className={`btn btn-sm ${addressSource === 'other' ? 'btn-gold' : 'btn-outline'}`}
                  onClick={() => setAddressSource('other')}
                  style={{ fontSize: '12px' }}
                >
                  New Address
                </button>
              </div>

              {addressSource === 'saved' && (
                <select 
                  className="form-input" 
                  value={user.addresses.findIndex(a => JSON.stringify(a) === JSON.stringify(pickupAddress))}
                  onChange={e => setPickupAddress(user.addresses[e.target.value])}
                >
                  {user.addresses?.map((a, i) => (
                    <option key={i} value={i}>{a.addressLine1}, {a.city}</option>
                  ))}
                </select>
              )}

              {addressSource === 'other' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'var(--ink-mid)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
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
                    placeholder="Pincode" 
                    value={otherAddress.pincode} 
                    onChange={e => setOtherAddress({...otherAddress, pincode: e.target.value})} 
                  />
                </div>
              )}

              {addressSource === 'shipping' && order && (
                <div style={{ padding: '12px', background: 'var(--ink-mid)', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }}>
                  <strong>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</strong><br/>
                  {order.shippingAddress.address}<br/>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                </div>
              )}

              {addressSource === 'billing' && order && (
                <div style={{ padding: '12px', background: 'var(--ink-mid)', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }}>
                  <strong>{order.billingAddress?.firstName || order.shippingAddress.firstName} {order.billingAddress?.lastName || order.shippingAddress.lastName}</strong><br/>
                  {order.billingAddress?.address || order.shippingAddress.address}<br/>
                  {order.billingAddress?.city || order.shippingAddress.city}, {order.billingAddress?.state || order.shippingAddress.state} {order.billingAddress?.zipCode || order.shippingAddress.zipCode}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn-outline" onClick={() => setStep(1)}>Back</button>
            <button className="btn btn-gold" onClick={() => setStep(3)}>Review Request</button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Submit */}
      {step === 3 && (
        <div className="step-content animate-fade-in">
          <div className="card" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '24px' }}>Review Your Request</h3>
            
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Items to Return</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedItems.map(item => (
                  <div key={item.orderItem} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={item.image} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                    <div style={{ flex: 1, fontSize: '14px' }}>
                      <strong>{item.quantity}x</strong> {item.name}
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Condition: {item.condition}</div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px', padding: '16px 0', borderTop: '1px solid #2e2c29', borderBottom: '1px solid #2e2c29' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Return Type</div>
                <div style={{ fontSize: '14px', color: 'var(--gold)', fontWeight: '600' }}>{returnType.toUpperCase()}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Reason</div>
                <div style={{ fontSize: '14px' }}>{reason.replace(/_/g, ' ')}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Estimated Refund</div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>₹{selectedItems.reduce((acc, i) => acc + (i.price * i.quantity), 0).toLocaleString('en-IN')}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Refund Method</div>
                <div style={{ fontSize: '14px' }}>{refundMethod.replace(/_/g, ' ')}</div>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Pickup Address</div>
              <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                {addressSource === 'shipping' && order && (
                  <>
                    <strong>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</strong><br/>
                    {order.shippingAddress.address}<br/>
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                  </>
                )}
                {addressSource === 'billing' && order && (
                  <>
                    <strong>{order.billingAddress?.firstName || order.shippingAddress.firstName} {order.billingAddress?.lastName || order.shippingAddress.lastName}</strong><br/>
                    {order.billingAddress?.address || order.shippingAddress.address}<br/>
                    {order.billingAddress?.city || order.shippingAddress.city}, {order.billingAddress?.state || order.shippingAddress.state} {order.billingAddress?.zipCode || order.shippingAddress.zipCode}
                  </>
                )}
                {addressSource === 'saved' && pickupAddress && (
                  <>
                    <strong>{pickupAddress.firstName || user.name} {pickupAddress.lastName}</strong><br/>
                    {pickupAddress.addressLine1}<br/>
                    {pickupAddress.city}, {pickupAddress.state} {pickupAddress.pincode}
                  </>
                )}
                {addressSource === 'other' && (
                  <>
                    <strong>{otherAddress.firstName} {otherAddress.lastName}</strong><br/>
                    {otherAddress.addressLine1}<br/>
                    {otherAddress.city}, {otherAddress.state} {otherAddress.pincode}
                  </>
                )}
              </div>
            </div>

            <div style={{ padding: '16px', background: 'rgba(201, 168, 76, 0.05)', borderRadius: '8px', border: '1px solid var(--gold)', marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Returns Policy Notice</div>
              <p style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: '1.5', margin: '0' }}>
                We want you to love every LuxeStore purchase. If you're not completely satisfied, you may return most items within 7 days of delivery. 
                Items must be unused, unworn, and in original packaging. Refunds are processed within 5–7 business days.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn-outline" onClick={() => setStep(2)}>Back</button>
            <button className="btn btn-gold" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Return Request'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
