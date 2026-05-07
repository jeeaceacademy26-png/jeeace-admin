import { useEffect, useState } from 'react'
import BatchSelector from '../components/BatchSelector'
import { getStudents, getAttendance, markAttendance } from '../api'

export default function Attendance() {
  const [batch, setBatch]       = useState(null)
  const [date, setDate]         = useState(new Date().toISOString().slice(0, 10))
  const [students, setStudents] = useState([])
  const [records, setRecords]   = useState({})
  const [loading, setLoading]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)

  useEffect(() => {
    if (!batch) return
    setLoading(true)
    Promise.all([getStudents(batch.id), getAttendance(batch.id, date)])
      .then(([s, a]) => {
        const list = s.students || []
        setStudents(list)
        const map = {}
        ;(a.records || []).forEach(r => { map[r.studentPhone] = r.status })
        list.forEach(s => { if (!map[s.phone]) map[s.phone] = 'present' })
        setRecords(map)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [batch, date])

  async function handleSave() {
    setSaving(true)
    try {
      const list = Object.entries(records).map(([phone, status]) => ({ phone, status }))
      await markAttendance(batch.id, date, list)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) { alert('Error: ' + err.message) }
    finally { setSaving(false) }
  }

  const total   = students.length
  const present = Object.values(records).filter(s => s === 'present').length
  const absent  = Object.values(records).filter(s => s === 'absent').length

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1"><h1 className="text-xl font-bold text-gray-900">Attendance</h1></div>
        <BatchSelector value={batch} onChange={setBatch} />
        <input type="date" className="input w-auto" value={date} onChange={e => setDate(e.target.value)} />
      </div>

      {batch && total > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{total}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{present}</p>
            <p className="text-xs text-gray-500 mt-0.5">Present</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-red-500">{absent}</p>
            <p className="text-xs text-gray-500 mt-0.5">Absent</p>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        {!batch ? (
          <div className="px-5 py-12 text-center text-gray-400">Select a batch above</div>
        ) : loading ? (
          <div className="px-5 py-12 text-center text-gray-400">Loading...</div>
        ) : students.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-400">No students enrolled</div>
        ) : (
          <>
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Student</p>
              <div className="flex items-center gap-4">
                <button className="text-xs font-medium text-green-600 hover:underline"
                  onClick={() => setRecords(r => Object.fromEntries(Object.keys(r).map(k => [k, 'present'])))}>
                  All Present
                </button>
                <button className="text-xs font-medium text-red-500 hover:underline"
                  onClick={() => setRecords(r => Object.fromEntries(Object.keys(r).map(k => [k, 'absent'])))}>
                  All Absent
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {students.map(s => (
                <div key={s.phone} className="px-5 py-3.5 flex items-center gap-3">
                  <span className="font-mono text-sm text-gray-800 flex-1">{s.phone}</span>
                  <div className="flex gap-2">
                    {['present','absent','late'].map(status => (
                      <button key={status} onClick={() => setRecords(r => ({...r, [s.phone]: status}))}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                          records[s.phone] === status
                            ? status === 'present' ? 'bg-green-500 text-white border-green-500'
                              : status === 'absent' ? 'bg-red-500 text-white border-red-500'
                              : 'bg-yellow-500 text-white border-yellow-500'
                            : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                        }`}>
                        {status[0].toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex justify-end">
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
