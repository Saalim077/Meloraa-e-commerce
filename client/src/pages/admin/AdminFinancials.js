import React, { useState, useEffect, useCallback } from 'react';
import { analyticsAPI } from '../../utils/api';
import { toast } from 'react-toastify';

export default function AdminFinancials() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await analyticsAPI.financialReport({ dateFrom, dateTo });
      setReport(res.data);
    } catch {
      toast.error('Failed to load financial report');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  if (loading && !report) return <div className="loading-center"><div className="spinner spinner-lg" /></div>;

  const { summary, hsnBreakdown, taxRateBreakdown } = report || {};

  return (
    <div className="financial-dashboard">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Financial Dashboard</h1>
          <p>Monitor revenue, tax collection, and GST compliance</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="date-filter" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', padding: '8px 16px', borderRadius: '12px', border: '1px solid #f0ebe4' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#8c857d' }}>Period:</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ border: 'none', fontSize: '0.85rem', outline: 'none' }} />
            <span>→</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ border: 'none', fontSize: '0.85rem', outline: 'none' }} />
          </div>
          <button className="btn btn-maroon" onClick={() => window.print()}>Export Report</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <div className="stat-card" style={{ padding: '24px', background: 'var(--maroon)', color: '#fff' }}>
          <div className="stat-label" style={{ color: 'rgba(255,255,255,0.7)' }}>Total Revenue</div>
          <div className="stat-value" style={{ color: '#fff' }}>{fmt(summary.totalRevenue)}</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Inclusive of all taxes & shipping</div>
        </div>
        <div className="stat-card" style={{ padding: '24px', background: '#fff' }}>
          <div className="stat-label">Taxable Value</div>
          <div className="stat-value" style={{ color: 'var(--sage)' }}>{fmt(summary.totalSubtotal)}</div>
          <div style={{ fontSize: '0.75rem', color: '#8c857d' }}>Net value before GST</div>
        </div>
        <div className="stat-card" style={{ padding: '24px', background: '#fff' }}>
          <div className="stat-label">Total GST Collected</div>
          <div className="stat-value" style={{ color: 'var(--gold)' }}>{fmt(summary.totalTax)}</div>
          <div style={{ fontSize: '0.75rem', color: '#8c857d' }}>IGST / CGST / SGST total</div>
        </div>
        <div className="stat-card" style={{ padding: '24px', background: '#fff' }}>
          <div className="stat-label">Total Shipping</div>
          <div className="stat-value" style={{ color: '#1a1917' }}>{fmt(summary.totalShipping)}</div>
          <div style={{ fontSize: '0.75rem', color: '#8c857d' }}>Logistics revenue</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
        {/* HSN Table */}
        <div className="table-wrap" style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #f0ebe4' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.1rem' }}>HSN-wise Tax Breakdown</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>HSN Code</th>
                <th>Qty</th>
                <th>Taxable Value</th>
                <th>GST Amount</th>
                <th>Total Value</th>
              </tr>
            </thead>
            <tbody>
              {hsnBreakdown?.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: '700' }}>{item.hsn}</td>
                  <td>{item.quantity}</td>
                  <td>{fmt(item.taxableValue)}</td>
                  <td style={{ color: 'var(--gold)', fontWeight: '600' }}>{fmt(item.calculatedTax)}</td>
                  <td style={{ fontWeight: '700' }}>{fmt(item.taxableValue + item.calculatedTax)}</td>
                </tr>
              ))}
              {hsnBreakdown?.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>No HSN data found for this period</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Tax Rate Breakdown */}
        <div className="table-wrap" style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #f0ebe4' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.1rem' }}>GST Rate Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {taxRateBreakdown?.map((rate, idx) => (
              <div key={idx} style={{ padding: '16px', borderRadius: '12px', background: '#fcfaf7', border: '1px solid #f0ebe4' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontWeight: '800', fontSize: '1rem' }}>{rate.rate}% GST Slab</span>
                  <span style={{ color: 'var(--maroon)', fontWeight: '700' }}>{fmt(rate.tax)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#8c857d' }}>
                  <span>Taxable Value:</span>
                  <span>{fmt(rate.taxable)}</span>
                </div>
                {/* Progress bar simulation */}
                <div style={{ height: '4px', background: '#e8e2db', borderRadius: '2px', marginTop: '12px', overflow: 'hidden' }}>
                  <div style={{ width: `${(rate.tax / summary.totalTax) * 100}%`, height: '100%', background: 'var(--gold)' }} />
                </div>
              </div>
            ))}
            {taxRateBreakdown?.length === 0 && <div style={{ textAlign: 'center', color: '#8c857d', padding: '20px' }}>No tax data found</div>}
          </div>

          <div style={{ marginTop: '32px', padding: '20px', background: '#f0ebe4', borderRadius: '12px', fontSize: '0.85rem' }}>
            <strong>💡 Pro Tip:</strong> These figures are calculated based on "PAID" orders only. Ensure all delivered orders are marked as paid for accurate GST filing.
          </div>
        </div>
      </div>
    </div>
  );
}
