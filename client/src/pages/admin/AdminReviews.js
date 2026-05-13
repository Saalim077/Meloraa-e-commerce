import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { reviewAPI } from '../../utils/api';

const fmtINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const starRating = (rating) => '⭐'.repeat(rating) + '☆'.repeat(5 - rating);

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reviewAPI.getAllReviews({ status: statusFilter, page, limit: 15 });
      setReviews(res.data.reviews);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id) => {
    try {
      await reviewAPI.updateReviewStatus(id, { status: 'approved' });
      toast.success('Review approved');
      load();
    } catch {
      toast.error('Failed to approve review');
    }
  };

  const handleReject = async (id) => {
    try {
      await reviewAPI.updateReviewStatus(id, {
        status: 'rejected',
        rejectionReason: rejectionReason[id] || 'Spam/Inappropriate content'
      });
      toast.success('Review rejected');
      load();
    } catch {
      toast.error('Failed to reject review');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await reviewAPI.deleteReview(id);
      toast.success('Review deleted');
      load();
    } catch {
      toast.error('Failed to delete review');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Reviews</h1>
        <p>Manage product reviews and ratings</p>
      </div>

      <div className="admin-filters">
        <select className="form-input" style={{ width: '220px' }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Reviews</option>
          <option value="pending">Pending Approval</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="table-wrap" style={{ padding: '24px' }}>
        {loading ? (
          <div className="loading-center"><div className="spinner spinner-lg" /></div>
        ) : reviews.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎯</div>
            <div className="empty-state-title">No Reviews Found</div>
            <div className="empty-state-text">There are no reviews matching your current selection. Once customers start sharing their thoughts, they will appear here.</div>
          </div>
        ) : (
          <>
            {reviews.map(review => (
              <div key={review._id} className="review-item" style={{ borderBottom: '1px solid #f0ebe4', paddingBottom: '24px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '6px', color: '#1a1917' }}>{review.title}</div>
                    <div style={{ fontSize: '0.85rem', color: '#6b665e', marginBottom: '12px', fontWeight: '600' }}>
                      {review.user?.name} • <span style={{ color: 'var(--maroon)' }}>{review.product?.name}</span>
                    </div>
                    <div style={{ marginBottom: '16px', fontSize: '1rem' }}>
                      {starRating(review.rating)}
                    </div>
                    {review.comment && (
                      <div style={{ fontSize: '0.95rem', color: '#333', marginBottom: '16px', lineHeight: '1.6', maxHeight: expandedId === review._id ? 'none' : '100px', overflow: 'hidden' }}>
                        {review.comment}
                      </div>
                    )}
                  </div>
                  <span className={`chip chip-${review.status}`}>
                    {review.status}
                  </span>
                </div>

                {review.status === 'pending' && (
                  <div style={{ marginTop: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button className="btn btn-sm btn-outline" onClick={() => handleApprove(review._id)} style={{ borderColor: '#1e7d32', color: '#1e7d32' }}>
                      ✓ Approve
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleReject(review._id)}>
                      ✕ Reject
                    </button>
                    <button className="btn btn-sm btn-outline" onClick={() => handleDelete(review._id)} style={{ color: '#666' }}>
                      Delete
                    </button>
                  </div>
                )}

                {review.status === 'rejected' && review.rejectionReason && (
                  <div style={{ marginTop: '12px', padding: '12px 16px', backgroundColor: '#fdf2f2', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid #fee2e2', color: '#991b1b' }}>
                    <strong>Rejection Reason:</strong> {review.rejectionReason}
                  </div>
                )}
              </div>
            ))}

            {pagination && pagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
                {Array.from({ length: pagination.pages }, (_, i) => (
                  <button
                    key={i + 1}
                    className={`btn btn-small ${page === i + 1 ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
