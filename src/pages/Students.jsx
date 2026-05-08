import { useEffect, useState } from 'react'
import BatchSelector from '../components/BatchSelector'
import { getStudents, bulkEnroll, resetDevice, getReportCard } from '../api'

function StatCard({ label, value, sub, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    green:  'bg-green-50  text-green-700  border-green-100',
    amber:  'bg-amber-50  text-amber-700  border-amber-100',
    red:    'bg-red-50    text-red-700    border-red-100',
  }
  return (
    <div className={`rounded-xl border px-4 py-3 text-center ${colors[color]}`}>
      <p className="text-2xl font-black">{value ?? '—'}</p>
      <p className="text-xs font-semibold mt-0.5">{label}</p>
      {sub && <p className="text-xs opacity-70 mt-0.5">{sub}</p>}
    </div>
  )
}

function ReportCardModal({ phone, batchId, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getReportCard(phone, batchId)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [phone, batchId])

  const pct = (n, d) => d > 0 ? Math.round((n / d) * 100) : null
  const fmt  = v => v != null ? `${v}%` : '—'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold opacity-70 uppercase tracking-wider">Report Card</p>
              <p className="text-xl font-black mt-0.5">{loading ? phone : (data?.studentName || phone)}</p>
              <p className="text-xs opacity-60 mt-1">
                {data ? `Generated ${new Date(data.generatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}` : ''}
              </p>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white text-xl leading-none">✕</button>
          </div>
        </div>

        {loading ? (
          <div className="px-6 py-16 text-center text-gray-400">Loading report...</div>
        ) : !data ? (
          <div className="px-6 py-16 text-center text-gray-400">Failed to load report</div>
        ) : (
          <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Snapshot grid */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Test Avg" value={fmt(data.tests.avgPct)} color="indigo" />
              <StatCard label="DPP Avg"  value={fmt(data.dpps.avgPct)}  color="green"  />
              <StatCard
                label="Attendance"
                value={fmt(data.attendance.pct)}
                sub={data.attendance.total > 0 ? `${data.attendance.present}/${data.attendance.total} classes` : null}
                color={data.attendance.pct != null && data.attendance.pct < 60 ? 'red' : 'amber'}
              />
            </div>

            {/* Rank */}
            {data.rank.total > 0 && (
              <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-5 py-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-indigo-600 flex flex-col items-center justify-center text-white">
                  <span className="text-xl font-black leading-none">#{data.rank.current ?? '—'}</span>
                  <span className="text-xs opacity-70">rank</span>
                </div>
                <div>
                  <p className="font-bold text-indigo-800">Batch Rank</p>
                  <p className="text-sm text-indigo-600">out of {data.rank.total} students who attempted tests</p>
                </div>
              </div>
            )}

            {/* Tests */}
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                <span className="text-base">📝</span>
                <span className="font-semibold text-gray-700 text-sm">Tests</span>
              </div>
              <div className="px-4 py-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Attempted</span>
                  <span className="font-semibold text-gray-800">{data.tests.attempted} / {data.tests.total}</span>
                </div>
                {data.tests.attempted > 0 && (
                  <>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${pct(data.tests.attempted, data.tests.total)}%` }} />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Average Score</span>
                      <span className="font-semibold text-indigo-600">{fmt(data.tests.avgPct)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Best Score</span>
                      <span className="font-semibold text-green-600">{fmt(data.tests.bestPct)}</span>
                    </div>
                  </>
                )}
                {data.tests.total === 0 && <p className="text-sm text-gray-400 text-center py-2">No tests scheduled yet</p>}
                {data.tests.total > 0 && data.tests.attempted === 0 && <p className="text-sm text-amber-500 text-center py-2">No tests attempted yet</p>}
              </div>
            </div>

            {/* DPPs */}
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                <span className="text-base">✏️</span>
                <span className="font-semibold text-gray-700 text-sm">Daily Practice Problems</span>
              </div>
              <div className="px-4 py-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Completed</span>
                  <span className="font-semibold text-gray-800">{data.dpps.attempted} / {data.dpps.total}</span>
                </div>
                {data.dpps.total > 0 && (
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${pct(data.dpps.attempted, data.dpps.total)}%` }} />
                  </div>
                )}
                {data.dpps.attempted > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Average Score</span>
                    <span className="font-semibold text-green-600">{fmt(data.dpps.avgPct)}</span>
                  </div>
                )}
                {data.dpps.total === 0 && <p className="text-sm text-gray-400 text-center py-2">No DPPs assigned yet</p>}
              </div>
            </div>

            {/* Doubts */}
            {data.doubts.total > 0 && (
              <div className="rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">❓</span>
                  <span className="font-semibold text-gray-700 text-sm">Doubts</span>
                </div>
                <span className="text-sm text-gray-500">
                  {data.doubts.resolved} resolved / {data.doubts.total} raised
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Students() {
  const [batch, setBatch]         = useState(null)
  const [students, setStudents]   = useState([])
  const [loading, setLoading]     = useState(false)
  const [showEnroll, setShowEnroll] = useState(false)
  const [phones, setPhones]       = useState('')
  const [saving, setSaving]       = useState(false)
  const [resetting, setResetting] = useState('')
  const [reportPhone, setReportPhone] = useState(null)

  useEffect(() => {
    if (!batch) return
    setLoading(true)
    getStudents(batch.id)
      .then(d => setStudents(d.students || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [batch])

  async function handleEnroll(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const list = phones.split(/[\n,]+/).map(p => p.trim()).filter(Boolean)
      await bulkEnroll(batch.id, list)
      const d = await getStudents(batch.id)
      setStudents(d.students || [])
      setShowEnroll(false)
      setPhones('')
    } catch (err) { alert('Error: ' + err.message) }
    finally { setSaving(false) }
  }

  async function handleReset(phone) {
    if (!confirm(`Reset device for ${phone}?`)) return
    setResetting(phone)
    try {
      await resetDevice(phone, batch.id)
      alert('Device reset. Student can now log in from a new device.')
    } catch (err) { alert('Error: ' + err.message) }
    finally { setResetting('') }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Students</h1>
        </div>
        <BatchSelector value={batch} onChange={setBatch} />
        {batch && <button className="btn-primary" onClick={() => setShowEnroll(true)}>+ Enroll Students</button>}
      </div>

      <div className="card overflow-hidden">
        {!batch ? (
          <div className="px-5 py-12 text-center text-gray-400">Select a batch above</div>
        ) : loading ? (
          <div className="px-5 py-12 text-center text-gray-400">Loading...</div>
        ) : students.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-400">
            <p className="text-4xl mb-3">👥</p>
            <p className="font-medium">No students enrolled</p>
            <p className="text-sm mt-1">Use "Enroll Students" to add them</p>
          </div>
        ) : (
          <>
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 grid grid-cols-12 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span className="col-span-5">Phone</span>
              <span className="col-span-3">Joined</span>
              <span className="col-span-4 text-right">Actions</span>
            </div>
            <div className="divide-y divide-gray-50">
              {students.map(s => (
                <div key={s.phone} className="px-5 py-3.5 grid grid-cols-12 items-center">
                  <span className="col-span-5 font-mono text-sm text-gray-800">{s.phone}</span>
                  <span className="col-span-3 text-xs text-gray-400">
                    {new Date(s.joinedAt).toLocaleDateString('en-IN')}
                  </span>
                  <div className="col-span-4 flex justify-end gap-3">
                    <button
                      onClick={() => setReportPhone(s.phone)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Report Card
                    </button>
                    <button
                      onClick={() => handleReset(s.phone)}
                      disabled={resetting === s.phone}
                      className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                    >
                      {resetting === s.phone ? 'Resetting...' : 'Reset Device'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
              {students.length} students enrolled
            </div>
          </>
        )}
      </div>

      {showEnroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="card w-full max-w-md p-6">
            <h2 className="font-bold text-gray-900 mb-1">Enroll Students</h2>
            <p className="text-sm text-gray-500 mb-4">Enter phone numbers separated by commas or new lines</p>
            <form onSubmit={handleEnroll} className="space-y-4">
              <textarea
                className="input h-40 resize-none font-mono"
                placeholder={"9876543210\n9123456789\n9988776655"}
                value={phones}
                onChange={e => setPhones(e.target.value)}
                required
              />
              <div className="flex gap-3">
                <button type="button" className="btn-outline flex-1" onClick={() => setShowEnroll(false)}>Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? 'Enrolling...' : 'Enroll'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {reportPhone && (
        <ReportCardModal
          phone={reportPhone}
          batchId={batch.id}
          onClose={() => setReportPhone(null)}
        />
      )}
    </div>
  )
}
