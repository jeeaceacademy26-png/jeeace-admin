import { useEffect, useState } from 'react'
import BatchSelector from '../components/BatchSelector'
import { getSchedule, addSlot, deleteSlot } from '../api'

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

export default function Schedule() {
  const [batch, setBatch]     = useState(null)
  const [slots, setSlots]     = useState([])
  const [loading, setLoading] = useState(false)
  const [show, setShow]       = useState(false)
  const [form, setForm]       = useState({ dayOfWeek: 'Monday', subject: '', startTime: '08:00', endTime: '09:30', faculty: '', room: '' })
  const [saving, setSaving]   = useState(false)
  const [deleting, setDeleting] = useState('')

  useEffect(() => {
    if (!batch) return
    setLoading(true)
    getSchedule(batch.id)
      .then(d => setSlots(d.schedule || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [batch])

  async function handleAdd(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await addSlot(batch.id, form)
      const d = await getSchedule(batch.id)
      setSlots(d.schedule || [])
      setShow(false)
    } catch (err) { alert('Error: ' + err.message) }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this slot?')) return
    setDeleting(id)
    try {
      await deleteSlot(id)
      setSlots(s => s.filter(x => x.id !== id))
    } catch (err) { alert('Error: ' + err.message) }
    finally { setDeleting('') }
  }

  const subjectColor = s => {
    if (s.toLowerCase().includes('physics'))   return 'bg-blue-50 text-blue-700'
    if (s.toLowerCase().includes('chem'))      return 'bg-green-50 text-green-700'
    if (s.toLowerCase().includes('math'))      return 'bg-purple-50 text-purple-700'
    return 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1"><h1 className="text-xl font-bold text-gray-900">Class Schedule</h1></div>
        <BatchSelector value={batch} onChange={setBatch} />
        {batch && <button className="btn-primary" onClick={() => setShow(true)}>+ Add Slot</button>}
      </div>

      {!batch ? (
        <div className="card px-5 py-12 text-center text-gray-400">Select a batch above</div>
      ) : loading ? (
        <div className="card px-5 py-12 text-center text-gray-400">Loading...</div>
      ) : (
        <div className="space-y-4">
          {DAYS.map(day => {
            const daySlots = slots.filter(s => s.day === day)
            if (!daySlots.length) return null
            return (
              <div key={day} className="card overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-700">{day}</p>
                </div>
                <div className="divide-y divide-gray-50">
                  {daySlots.map(s => (
                    <div key={s.id} className="px-5 py-3.5 flex items-center gap-3">
                      <div className="text-xs font-mono text-gray-500 w-24 shrink-0">{s.startTime}–{s.endTime}</div>
                      <span className={`badge ${subjectColor(s.subject)}`}>{s.subject}</span>
                      <span className="text-sm text-gray-600 flex-1">{s.faculty}{s.room ? ` · ${s.room}` : ''}</span>
                      <button onClick={() => handleDelete(s.id)} disabled={deleting === s.id}
                        className="text-xs text-red-400 hover:text-red-600 disabled:opacity-40">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          {slots.length === 0 && (
            <div className="card px-5 py-12 text-center text-gray-400">
              <p className="text-4xl mb-3">🗓️</p><p className="font-medium">No schedule added yet</p>
            </div>
          )}
        </div>
      )}

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="card w-full max-w-md p-6">
            <h2 className="font-bold text-gray-900 mb-4">Add Schedule Slot</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="label">Day</label>
                <select className="input" value={form.dayOfWeek} onChange={e => setForm(f => ({...f, dayOfWeek: e.target.value}))}>
                  {DAYS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Subject</label>
                <input className="input" placeholder="e.g. Physics" value={form.subject}
                  onChange={e => setForm(f => ({...f, subject: e.target.value}))} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Start Time</label>
                  <input className="input" type="time" value={form.startTime}
                    onChange={e => setForm(f => ({...f, startTime: e.target.value}))} required />
                </div>
                <div>
                  <label className="label">End Time</label>
                  <input className="input" type="time" value={form.endTime}
                    onChange={e => setForm(f => ({...f, endTime: e.target.value}))} required />
                </div>
              </div>
              <div>
                <label className="label">Faculty Name</label>
                <input className="input" placeholder="e.g. Mr. Sharma" value={form.faculty}
                  onChange={e => setForm(f => ({...f, faculty: e.target.value}))} required />
              </div>
              <div>
                <label className="label">Room (optional)</label>
                <input className="input" placeholder="e.g. Room 101" value={form.room}
                  onChange={e => setForm(f => ({...f, room: e.target.value}))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" className="btn-outline flex-1" onClick={() => setShow(false)}>Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? 'Adding...' : 'Add Slot'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
