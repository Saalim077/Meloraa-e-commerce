import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchReturn, cancelReturn } from '../store';
import { toast } from 'react-toastify';
import Header from '../components/Header';

const STATUS_ORDER = [
  'pending', 'approved', 'pickup_scheduled', 'in_transit', 
  'received', 'inspecting', 'completed'
];

const STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  pickup_scheduled: 'Pickup Scheduled',
  in_transit: 'In Transit',
  received: 'Received',
  inspecting: 'Inspecting',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

export default function ReturnStatusPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentReturn: rma, loading } = useSelector(s => s.returns);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    dispatch(fetchReturn(id));
  }, [dispatch, id]);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this return request?')) return;
    setCancelling(true);
    try {
      await dispatch(cancelReturn(id)).unwrap();
      toast.success('Return request cancelled');
      dispatch(fetchReturn(id));
    } catch (err) {
      toast.error(err || 'Failed to cancel');
    } finally {
      setCancelling(false);
    }
  };

  if (loading && !rma) return <div className="loading-center"><div className="spinner spinner-lg" /></div>;
  if (!rma) return <div className="loading-center">Return request not found.</div>;

  const currentStatusIndex = STATUS_ORDER.indexOf(rma.status);
  const isSpecialStatus = ['rejected', 'cancelled'].includes(rma.status);

  return (
    <>
      <Header />
      <div className="container" style={{ maxWidth: '1100px', padding: '60px 24px' }}>
        <div style={{ marginBottom: '32px' }}>
          <Link to="/profile" style={{ color: '#888', textDecoration: 'none', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '600' }}>
            ← Back to Profile
          </Link>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px', borderBottom: '1px solid #eee', paddingBottom: '32px' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--maroon)', marginBottom: '12px', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              RMA #{rma.rmaNumber}
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3.2rem', color: 'var(--maroon)', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              Tracking Return
            </h1>
            <p style={{ color: '#888', fontSize: '0.95rem', margin: 0 }}>
              Requested on {new Date(rma.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          {['pending', 'approved'].includes(rma.status) && (
            <button 
              className="btn-cancel-return" 
              onClick={handleCancel} 
              disabled={cancelling}
              style={{
                padding: '12px 24px',
                background: 'transparent',
                border: '1px solid #ff4d4d',
                color: '#ff4d4d',
                fontSize: '11px',
                fontWeight: '700',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              {cancelling ? 'PROCESSING...' : 'CANCEL REQUEST'}
            </button>
          )}
        </div>

        {/* Progress Stepper */}
        {!isSpecialStatus && (
          <div className="rma-stepper" style={{ marginBottom: '80px', padding: '0 40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '20px', left: '0', right: '0', height: '2px', background: '#eee', zIndex: '0' }} />
              <div style={{ position: 'absolute', top: '20px', left: '0', width: `${(currentStatusIndex / (STATUS_ORDER.length - 1)) * 100}%`, height: '2px', background: 'var(--maroon)', zIndex: '0', transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }} />
              
              {STATUS_ORDER.map((s, i) => {
                const isCompleted = currentStatusIndex > i;
                const isActive = currentStatusIndex === i;
                return (
                  <div key={s} style={{ zIndex: '1', textAlign: 'center', width: '100px' }}>
                    <div style={{ 
                      width: '40px', height: '40px', borderRadius: '50%', 
                      background: isCompleted ? 'var(--maroon)' : isActive ? 'white' : 'white',
                      border: `2px solid ${isCompleted || isActive ? 'var(--maroon)' : '#eee'}`,
                      color: isCompleted ? 'white' : isActive ? 'var(--maroon)' : '#ccc',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                      fontSize: '14px', fontWeight: '700',
                      boxShadow: isActive ? '0 0 0 5px rgba(128, 0, 0, 0.1)' : 'none',
                      transition: 'all 0.4s'
                    }}>
                      {isCompleted ? '✓' : i + 1}
                    </div>
                    <div style={{ 
                      fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', 
                      color: isActive ? 'var(--maroon)' : '#aaa',
                      fontWeight: isActive ? '800' : '600'
                    }}>
                      {STATUS_LABELS[s]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isSpecialStatus && (
          <div style={{ padding: '40px', background: '#fffafa', border: '1px solid #ff4d4d', textAlign: 'center', marginBottom: '60px' }}>
            <h3 style={{ color: '#ff4d4d', fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '12px' }}>
              Request {STATUS_LABELS[rma.status]}
            </h3>
            <p style={{ color: '#666', fontSize: '1rem', margin: 0 }}>
              {rma.status === 'cancelled' ? 'This return request has been cancelled by the user.' : rma.rejectionReason}
            </p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '60px', alignItems: 'start' }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
            
            <section>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', marginBottom: '24px', borderBottom: '1px solid #eee', paddingBottom: '16px' }}>Return Details</h3>
              
              <div style={{ background: '#fcfcfc', border: '1px solid #eee', padding: '32px', marginBottom: '24px' }}>
                <label style={{ fontSize: '10px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.15em', display: 'block', marginBottom: '20px', fontWeight: '700' }}>Items to Return</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {rma.items.map(item => (
                    <div key={item._id} style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                      <img src={item.product?.images?.[0]} alt="" style={{ width: '100px', height: '130px', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.product?.name}</div>
                        <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '12px' }}>
                          Qty: <strong>{item.quantity}</strong> &nbsp;•&nbsp; Condition: <span style={{ textTransform: 'capitalize' }}>{item.condition}</span>
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--maroon)' }}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                <div style={{ background: '#fcfcfc', border: '1px solid #eee', padding: '24px' }}>
                  <label style={{ fontSize: '10px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'block', marginBottom: '8px', fontWeight: '700' }}>Return Type</label>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1a1a1a', textTransform: 'capitalize' }}>{rma.type}</div>
                </div>
                <div style={{ background: '#fcfcfc', border: '1px solid #eee', padding: '24px' }}>
                  <label style={{ fontSize: '10px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'block', marginBottom: '8px', fontWeight: '700' }}>Reason</label>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1a1a1a', textTransform: 'capitalize' }}>{rma.reason.replace(/_/g, ' ')}</div>
                </div>
              </div>

              {rma.reasonDetails && (
                <div style={{ marginTop: '32px', background: '#fff', border: '1px solid #eee', padding: '24px' }}>
                  <label style={{ fontSize: '10px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'block', marginBottom: '12px', fontWeight: '700' }}>Your Explanation</label>
                  <div style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#444', fontStyle: 'italic' }}>"{rma.reasonDetails}"</div>
                </div>
              )}
            </section>

            <section>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', marginBottom: '24px', borderBottom: '1px solid #eee', paddingBottom: '16px' }}>Pickup Logistics</h3>
              <div style={{ background: '#fcfcfc', border: '1px solid #eee', padding: '32px' }}>
                <div style={{ fontSize: '1rem', lineHeight: '1.8', color: '#1a1a1a' }}>
                  <strong style={{ display: 'block', marginBottom: '8px', fontSize: '1.1rem' }}>{rma.pickupAddress?.firstName} {rma.pickupAddress?.lastName}</strong>
                  {rma.pickupAddress?.addressLine1}<br/>
                  {rma.pickupAddress?.city}, {rma.pickupAddress?.state} - {rma.pickupAddress?.pincode}<br/>
                  <span style={{ color: '#888', display: 'block', marginTop: '12px', fontSize: '0.9rem' }}>Phone: {rma.pickupAddress?.phone || 'N/A'}</span>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '32px', position: 'sticky', top: '120px' }}>
            <div style={{ background: '#fff', border: '1px solid #eee', padding: '32px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '24px', color: 'var(--maroon)' }}>Activity Log</h3>
              <div className="rma-timeline">
                {rma.timeline.slice().reverse().map((t, i) => (
                  <div key={i} style={{ position: 'relative', paddingLeft: '32px', marginBottom: '32px' }}>
                    {i !== rma.timeline.length - 1 && (
                      <div style={{ position: 'absolute', left: '7px', top: '24px', bottom: '-16px', width: '1px', background: '#eee' }} />
                    )}
                    <div style={{ 
                      position: 'absolute', left: '0', top: '4px', width: '15px', height: '15px', borderRadius: '50%', 
                      background: i === 0 ? 'var(--maroon)' : 'white', border: `2px solid ${i === 0 ? 'var(--maroon)' : '#eee'}`
                    }} />
                    <div style={{ fontSize: '0.92rem', fontWeight: '700', color: i === 0 ? '#1a1a1a' : '#888', marginBottom: '4px' }}>{t.message}</div>
                    <div style={{ fontSize: '0.75rem', color: '#aaa', fontWeight: '500' }}>
                      {new Date(t.date).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {rma.refundAmount > 0 && (
              <div style={{ background: 'var(--maroon)', padding: '32px', color: 'white' }}>
                <h3 style={{ fontSize: '0.75rem', marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: '700', opacity: 0.8, color: '#fff' }}>Refund Summary</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>Refund Amount</span>
                  <span style={{ fontSize: '1.8rem', fontWeight: '700', fontFamily: 'var(--font-body)' }}>₹{rma.refundAmount.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <span style={{ opacity: 0.7 }}>Payment Method</span>
                  <span style={{ fontWeight: '600', textTransform: 'capitalize' }}>{rma.refundMethod?.replace(/_/g, ' ')}</span>
                </div>
              </div>
            )}

            {rma.exchangeOrder && (
              <div style={{ background: '#fcfcfc', border: '1px solid #eee', padding: '32px' }}>
                <h3 style={{ fontSize: '0.8rem', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: '700', color: '#888' }}>Exchange Details</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '4px' }}>Order #{rma.exchangeOrder.orderNumber}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--maroon)', fontWeight: '700', textTransform: 'uppercase' }}>Status: {rma.exchangeOrder.status}</div>
                  </div>
                  <Link to={`/profile`} style={{ fontSize: '11px', fontWeight: '700', color: '#1a1a1a', textDecoration: 'underline', textTransform: 'uppercase' }}>View Order</Link>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}
