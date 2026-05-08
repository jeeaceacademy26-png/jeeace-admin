import { useState, useEffect } from 'react';
import { getFeePlans, createFeePlan, deleteFeePlan, getFeeStatus, getFeePayments, confirmPayment, assignFeePlan, getBatches } from '../api';

const PLAN_TYPES = [
  { value: 'full', label: 'Full Payment', installments: 1 },
  { value: 'quarterly', label: 'Quarterly (4 installments)', installments: 4 },
  { value: 'monthly', label: 'Monthly (12 installments)', installments: 12 },
];

function buildInstallments(planType, totalAmount, startDate) {
  const count = PLAN_TYPES.find(p => p.value === planType)?.installments || 1;
  const perInstall = Math.round(totalAmount / count);
  return Array.from({ length: count }, (_, i) => {
    const due = startDate ? new Date(startDate) : new Date();
    due.setMonth(due.getMonth() + i * (planType === 'quarterly' ? 3 : 1));
    return {
      number: i + 1,
      amount: i === count - 1 ? totalAmount - perInstall * (count - 1) : perInstall,
      dueDate: due.toISOString().split('T')[0],
    };
  });
}

export default function Fees() {
  const [batches, setBatches] = useState([]);
  const [batchId, setBatchId] = useState('');
  const [plans, setPlans] = useState([]);
  const [status, setStatus] = useState([]);
  const [payments, setPayments] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  // Create plan form
  const [showForm, setShowForm] = useState(false);
  const [planName, setPlanName] = useState('');
  const [planType, setPlanType] = useState('full');
  const [totalAmount, setTotalAmount] = useState(50000);
  const [startDate, setStartDate] = useState('');

  // Assign plan
  const [assignPhone, setAssignPhone] = useState('');
  const [assignPlanId, setAssignPlanId] = useState('');

  useEffect(() => {
    getBatches().then(d => {
      setBatches(d.batches || []);
      if (d.batches?.length) setBatchId(d.batches[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!batchId) return;
    load();
  }, [batchId]);

  async function load() {
    setLoading(true);
    try {
      const [p, s, pay] = await Promise.all([
        getFeePlans(batchId),
        getFeeStatus(batchId),
        getFeePayments(batchId),
      ]);
      setPlans(p.plans || []);
      setStatus(s.students || []);
      setPayments(pay.payments || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function handleCreatePlan(e) {
    e.preventDefault();
    try {
      const installments = planType === 'full'
        ? [{ number: 1, amount: totalAmount, dueDate: startDate || null }]
        : buildInstallments(planType, totalAmount, startDate);
      await createFeePlan(batchId, { name: planName, totalAmount, planType, installments });
      setPlanName(''); setShowForm(false);
      load();
    } catch (e) { alert('Error: ' + e.message); }
  }

  async function handleDeletePlan(id) {
    if (!confirm('Delete this fee plan?')) return;
    await deleteFeePlan(id);
    load();
  }

  async function handleAssign(e) {
    e.preventDefault();
    try {
      await assignFeePlan(assignPhone, batchId, parseInt(assignPlanId));
      alert('Fee plan assigned!');
      setAssignPhone(''); setAssignPlanId('');
      load();
    } catch (e) { alert('Error: ' + e.message); }
  }

  async function handleConfirm(paymentId) {
    try {
      await confirmPayment(paymentId, localStorage.getItem('adminPhone'));
      load();
    } catch (e) { alert('Error: ' + e.message); }
  }

  const totalCollected = status.reduce((s, r) => s + r.paid, 0);
  const totalDue = status.reduce((s, r) => s + r.due, 0);
  const pendingCount = payments.filter(p => p.status === 'initiated').length;

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>💰 Fee Management</h2>
        <select value={batchId} onChange={e => setBatchId(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14 }}>
          {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Collected', value: `₹${totalCollected.toLocaleString()}`, color: '#16a34a' },
          { label: 'Total Due', value: `₹${totalDue.toLocaleString()}`, color: '#dc2626' },
          { label: 'Pending Confirmations', value: pendingCount, color: '#d97706' },
        ].map(c => (
          <div key={c.label} style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['overview', 'plans', 'payments'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
              background: tab === t ? '#6366f1' : '#f3f4f6', color: tab === t ? '#fff' : '#374151' }}>
            {t === 'overview' ? '👥 Students' : t === 'plans' ? '📋 Fee Plans' : '💳 Payments'}
          </button>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', color: '#6b7280', padding: 40 }}>Loading...</div>}

      {/* OVERVIEW TAB */}
      {!loading && tab === 'overview' && (
        <div>
          {/* Assign Plan */}
          <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, marginBottom: 16, border: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>Assign Fee Plan to Student</div>
            <form onSubmit={handleAssign} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input value={assignPhone} onChange={e => setAssignPhone(e.target.value)}
                placeholder="Student phone (10 digits)" required
                style={{ flex: 1, minWidth: 160, padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14 }} />
              <select value={assignPlanId} onChange={e => setAssignPlanId(e.target.value)} required
                style={{ flex: 1, minWidth: 160, padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14 }}>
                <option value="">Select plan</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name} — ₹{p.total_amount}</option>)}
              </select>
              <button type="submit"
                style={{ padding: '8px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                Assign
              </button>
            </form>
          </div>

          {/* Student list */}
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Student', 'Plan', 'Paid', 'Due', 'Status'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {status.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>No students yet</td></tr>
                )}
                {status.map((s, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600 }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>{s.phone}</div>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#6b7280' }}>{s.planName || <span style={{ color: '#d1d5db' }}>Not assigned</span>}</td>
                    <td style={{ padding: '12px 16px', color: '#16a34a', fontWeight: 600 }}>₹{s.paid.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', color: s.due > 0 ? '#dc2626' : '#6b7280', fontWeight: 600 }}>₹{s.due.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {s.pendingConfirmations > 0
                        ? <span style={{ background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>⏳ Verify</span>
                        : s.due === 0 && s.paid > 0
                        ? <span style={{ background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>✅ Paid</span>
                        : s.planName
                        ? <span style={{ background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>Due</span>
                        : <span style={{ color: '#d1d5db', fontSize: 12 }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PLANS TAB */}
      {!loading && tab === 'plans' && (
        <div>
          <button onClick={() => setShowForm(!showForm)}
            style={{ marginBottom: 16, padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
            + New Fee Plan
          </button>

          {showForm && (
            <form onSubmit={handleCreatePlan}
              style={{ background: '#f8fafc', borderRadius: 12, padding: 20, marginBottom: 16, border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Create Fee Plan</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>PLAN NAME</label>
                  <input value={planName} onChange={e => setPlanName(e.target.value)} placeholder="e.g. JEE 2026 Full Fee" required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>TOTAL AMOUNT (₹)</label>
                  <input type="number" value={totalAmount} onChange={e => setTotalAmount(parseInt(e.target.value))} required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>PAYMENT TYPE</label>
                  <select value={planType} onChange={e => setPlanType(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14 }}>
                    {PLAN_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>START DATE</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' }} />
                </div>
              </div>
              {planType !== 'full' && (
                <div style={{ marginTop: 12, fontSize: 13, color: '#6b7280', background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}>
                  📅 {PLAN_TYPES.find(p => p.value === planType)?.installments} installments of ₹{Math.round(totalAmount / (PLAN_TYPES.find(p => p.value === planType)?.installments || 1)).toLocaleString()} each
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button type="submit"
                  style={{ padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                  Create Plan
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ padding: '10px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {plans.length === 0 && <div style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>No fee plans yet</div>}
            {plans.map(plan => (
              <div key={plan.id} style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{plan.name}</div>
                    <div style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>
                      ₹{parseFloat(plan.total_amount).toLocaleString()} · {PLAN_TYPES.find(p => p.value === plan.plan_type)?.label || plan.plan_type}
                    </div>
                  </div>
                  <button onClick={() => handleDeletePlan(plan.id)}
                    style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    Delete
                  </button>
                </div>
                {plan.installments?.length > 0 && (
                  <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {plan.installments.map(inst => (
                      <div key={inst.id} style={{ background: '#f8fafc', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: '#374151' }}>
                        #{inst.installment_number} · ₹{parseFloat(inst.amount).toLocaleString()}
                        {inst.due_date && <span style={{ color: '#9ca3af' }}> · {new Date(inst.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PAYMENTS TAB */}
      {!loading && tab === 'payments' && (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Student', 'Plan', 'Installment', 'Amount', 'UPI Ref', 'Status', 'Action'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>No payments yet</td></tr>
              )}
              {payments.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>{p.phone}</div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: 13 }}>{p.planName}</td>
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>#{p.installment}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>₹{p.amount.toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: 12 }}>{p.upiRef || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {p.status === 'paid'
                      ? <span style={{ background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>✅ Paid</span>
                      : p.status === 'initiated'
                      ? <span style={{ background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>⏳ Verify</span>
                      : <span style={{ background: '#f3f4f6', color: '#6b7280', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>Pending</span>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {p.status === 'initiated' && (
                      <button onClick={() => handleConfirm(p.id)}
                        style={{ padding: '6px 12px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                        Confirm
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
