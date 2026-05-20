import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { returnAPI } from '../../utils/api';
import { toast } from 'react-toastify';

export default function AdminReturnDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rma, setRma] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Status update states
  const [status, setStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [refundAmount, setRefundAmount] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await returnAPI.getDetail(id);
        setRma(res.data.rma);
        setStatus(res.data.rma.status);
        setAdminNotes(res.data.rma.adminNotes || '');
        setCustomerNotes(res.data.rma.customerNotes || '');
        setRefundAmount(res.data.rma.refundAmount || res.data.rma.items.reduce((acc, i) => acc + (i.price * i.quantity), 0));
      } catch (err) {
        toast.error('Failed to load RMA details');
        navigate('/admin/returns');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const handleUpdate = async () => {
    if (status === 'rejected' && !rejectionReason) {
      return toast.error('Please provide a rejection reason');
    }

    setProcessing(true);
    try {
      const res = await returnAPI.updateStatus(id, {
        status,
        adminNotes,
        customerNotes,
        rejectionReason,
        refundAmount
      });
      setRma(res.data.rma);
      toast.success('RMA status updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner spinner-lg" /></div>;
  if (!rma) return <div className="loading-center">RMA not found</div>;

  const totalReturnVal = rma.items.reduce((acc, i) => acc + (i.price * i.quantity), 0);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Link to="/admin/returns" style={{ color: 'var(--gold)', textDecoration: 'none', fontSize: '14px' }}>← Back to Returns</Link>
      </div>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ marginBottom: '8px' }}>RMA {rma.rmaNumber}</h1>
          <p style={{ color: 'var(--muted)' }}>Requested by {rma.user?.name} on {new Date(rma.createdAt).toLocaleDateString()}</p>
        </div>
        <div>
          <span className={`chip chip-${rma.status}`} style={{ fontSize: '14px', padding: '8px 16px', textTransform: 'capitalize' }}>
            {rma.status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '32px' }}>
        {/* Main Content */}
        <div>
          {/* Items Section */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '20px', borderBottom: '1px solid #2e2c29', paddingBottom: '12px' }}>Return Items</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {rma.items.map(item => (
                <div key={item._id} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <img src={item.product?.images?.[0]} alt="" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>{item.product?.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>SKU: {item.product?.sku} | Condition: <strong style={{color:'var(--gold)'}}>{item.condition}</strong></div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '600' }}>{item.quantity} x ₹{item.price.toLocaleString('en-IN')}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Total: ₹{(item.price * item.quantity).toLocaleString('en-IN')}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #2e2c29', display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'var(--muted)', fontSize: '12px', textTransform: 'uppercase' }}>Subtotal Return Value</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--gold)' }}>₹{totalReturnVal.toLocaleString('en-IN')}</div>
              </div>
            </div>
          </div>

          {/* Details & Photos */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>Request Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
              <div>
                <label className="form-label-sm">Return Type</label>
                <div style={{ textTransform: 'capitalize' }}>{rma.type}</div>
              </div>
              <div>
                <label className="form-label-sm">Reason</label>
                <div style={{ textTransform: 'capitalize' }}>{rma.reason.replace(/_/g, ' ')}</div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label className="form-label-sm">Customer Note</label>
                <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--muted)' }}>{rma.reasonDetails || 'No additional details provided.'}</p>
              </div>
            </div>

            {rma.photos?.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <label className="form-label-sm">Attached Photos</label>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {rma.photos.map((p, i) => (
                    <a key={i} href={p} target="_blank" rel="noreferrer">
                      <img src={p} alt="" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #2e2c29' }} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="card">
            <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>Timeline</h3>
            <div className="timeline-admin">
              {rma.timeline.map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ width: '100px', fontSize: '11px', color: 'var(--muted)', pt: '3px' }}>
                    {new Date(t.date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>{t.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div>
          <div className="card" style={{ position: 'sticky', top: '24px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>Process Return</h3>
            
            <div className="form-group">
              <label className="form-label">Update Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className="form-input">
                <option value="pending">Pending Review</option>
                <option value="approved">Approve & Send Label</option>
                <option value="rejected">Reject Request</option>
                <option value="pickup_scheduled">Pickup Scheduled</option>
                <option value="in_transit">In Transit</option>
                <option value="received">Received / Received & Inspecting</option>
                <option value="inspecting">Inspecting</option>
                <option value="completed">Complete & Issue Refund</option>
              </select>
            </div>

            {status === 'rejected' && (
              <div className="form-group animate-fade-in">
                <label className="form-label">Rejection Reason (Sent to Customer)</label>
                <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} className="form-input" rows="3" />
              </div>
            )}

            {(status === 'completed' || status === 'approved') && (
              <div className="form-group animate-fade-in">
                <label className="form-label">Refund Amount</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--muted)' }}>₹</span>
                  <input type="number" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} className="form-input" style={{ paddingLeft: '28px' }} />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--gold)', marginTop: '4px' }}>Recommend: ₹{totalReturnVal}</div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Admin Notes (Internal Only)</label>
              <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} className="form-input" rows="2" />
            </div>

            <div className="form-group">
              <label className="form-label">Message to Customer</label>
              <textarea value={customerNotes} onChange={e => setCustomerNotes(e.target.value)} className="form-input" rows="2" placeholder="Visible to customer in status page..." />
            </div>

            <button className="btn btn-gold btn-block" onClick={handleUpdate} disabled={processing}>
              {processing ? 'Processing...' : 'Apply Status Change'}
            </button>

            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #2e2c29' }}>
               <h4 style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '12px' }}>Customer Info</h4>
               <div style={{ fontSize: '14px' }}>
                 <strong>{rma.user?.name}</strong>
                 <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{rma.user?.email}</div>
               </div>
               <div style={{ marginTop: '16px', fontSize: '12px' }}>
                 <div style={{ color: 'var(--muted)' }}>Pickup Address:</div>
                 <div>{rma.pickupAddress?.addressLine1}, {rma.pickupAddress?.city}</div>
               </div>
               <div style={{ marginTop: '16px' }}>
                 <Link to={`/admin/orders/${rma.order?._id}`} className="btn btn-outline btn-sm btn-block">View Original Order</Link>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
