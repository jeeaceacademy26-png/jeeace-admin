import { useEffect, useState } from 'react'
import { getDashboard, getBatches, createBatch } from '../api'

function StatCard({ icon, label, value, sub, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green:  'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-700',
    blue:   'bg-blue-50 text-blue-600',
  }
  return (
    <div className="card p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 ${colors[color]}`}>{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-600 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats]     = useState(null)
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', batchCode: '', examId: 'jee_main' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([getDashboard(), getBatches()])
      .then(([d, b]) => { setStats(d); setBatches(b.batches || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await createBatch(form.name, form.batchCode.toUpperCase(), form.examId)
      const b = await getBatches()
      setBatches(b.batches || [])
      setShowCreate(false)
      setForm({ name: '', batchCode: '', examId: 'jee_main' })
    } catch (err) {
      alert('Error: ' + err.message)
    } finally { setSaving(false) }
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">{localStorage.getItem('coachingName')}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>+ New Batch</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="👥" label="Total Students" value={stats?.totalStudents ?? '—'} color="indigo" />
        <StatCard icon="📝" label="Tests Created"  value={stats?.totalTests ?? '—'}    color="blue" />
        <StatCard icon="📋" label="DPPs Assigned"  value={stats?.totalDpps ?? '—'}     color="yellow" />
        <StatCard icon="🏆" label="Avg Accuracy"   value={stats?.avgAccuracy ? `${stats.avgAccuracy}%` : '—'} color="green" />
      </div>

      {/* Batches */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Batches</h2>
        </div>
        {batches.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-400">
            <p className="text-4xl mb-3">🗂️</p>
            <p className="font-medium">No batches yet</p>
            <p className="text-sm mt-1">Create your first batch to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {batches.map(b => (
              <div key={b.id} className="px-5 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-primary font-black text-sm">{b.name[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{b.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{b.batchCode}</p>
                </div>
                <span className="badge-blue">{b.examId}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Batch Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="card w-full max-w-md p-6">
            <h2 className="font-bold text-gray-900 mb-4">Create New Batch</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">Batch Name</label>
                <input className="input" placeholder="e.g. JEE 2026 Dropper A"
                  value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required />
              </div>
              <div>
                <label className="label">Batch Code (students use this to join)</label>
                <input className="input uppercase font-mono" placeholder="e.g. DROP-A-2026"
                  value={form.batchCode} onChange={e => setForm(f => ({...f, batchCode: e.target.value}))} required />
              </div>
              <div>
                <label className="label">Exam</label>
                <select className="input" value={form.examId} onChange={e => setForm(f => ({...f, examId: e.target.value}))}>
                  <option value="jee_main">JEE Main</option>
                  <option value="jee_adv">JEE Advanced</option>
                  <option value="neet">NEET</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" className="btn-outline flex-1" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? 'Creating...' : 'Create Batch'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
