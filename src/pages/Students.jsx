import { useEffect, useState } from 'react'
import BatchSelector from '../components/BatchSelector'
import { getStudents, bulkEnroll, resetDevice } from '../api'

export default function Students() {
  const [batch, setBatch]       = useState(null)
  const [students, setStudents] = useState([])
  const [loading, setLoading]   = useState(false)
  const [showEnroll, setShowEnroll] = useState(false)
  const [phones, setPhones]     = useState('')
  const [saving, setSaving]     = useState(false)
  const [resetting, setResetting] = useState('')

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
              <span className="col-span-4">Joined</span>
              <span className="col-span-3 text-right">Actions</span>
            </div>
            <div className="divide-y divide-gray-50">
              {students.map(s => (
                <div key={s.phone} className="px-5 py-3.5 grid grid-cols-12 items-center">
                  <span className="col-span-5 font-mono text-sm text-gray-800">{s.phone}</span>
                  <span className="col-span-4 text-xs text-gray-400">
                    {new Date(s.joinedAt).toLocaleDateString('en-IN')}
                  </span>
                  <div className="col-span-3 flex justify-end">
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
    </div>
  )
}
