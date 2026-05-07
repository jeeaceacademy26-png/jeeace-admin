import { useEffect, useState } from 'react'
import BatchSelector from '../components/BatchSelector'
import { getDpps, createDpp, deleteDpp } from '../api'

const SUBJECTS = [
  { label: 'Physics',   prefix: 'phy',  chapters: 15 },
  { label: 'Chemistry', prefix: 'chem', chapters: 15 },
  { label: 'Maths',     prefix: 'math', chapters: 15 },
]

const chapterLabel = (id) => {
  if (!id) return id
  const m = id.match(/^(phy|chem|math)_ch(\d+)$/)
  if (!m) return id
  const subj = m[1] === 'phy' ? 'Physics' : m[1] === 'chem' ? 'Chemistry' : 'Maths'
  return `${subj} — Chapter ${m[2]}`
}

const empty = { title: '', chapterId: '', questionCount: 10, dueAt: '' }

export default function Dpps() {
  const [batch, setBatch]     = useState(null)
  const [dpps, setDpps]       = useState([])
  const [loading, setLoading] = useState(false)
  const [show, setShow]       = useState(false)
  const [form, setForm]       = useState(empty)
  const [saving, setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    if (!batch) return
    setLoading(true)
    getDpps(batch.id)
      .then(d => setDpps(d.dpps || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [batch])

  // Auto-fill title when chapter changes
  useEffect(() => {
    if (form.chapterId) {
      setForm(f => ({ ...f, title: chapterLabel(f.chapterId) + ' DPP' }))
    }
  }, [form.chapterId])

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.chapterId) return alert('Please select a chapter')
    setSaving(true)
    try {
      await createDpp(batch.id, {
        title:         form.title,
        chapterId:     form.chapterId,
        questionCount: Number(form.questionCount),
        dueAt:         form.dueAt || null,
      })
      const d = await getDpps(batch.id)
      setDpps(d.dpps || [])
      setShow(false)
      setForm(empty)
    } catch (err) {
      alert('Error: ' + (JSON.parse(err.message)?.error || err.message))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(dppId) {
    if (!confirm('Delete this DPP? Students will no longer see it.')) return
    setDeleting(dppId)
    try {
      await deleteDpp(dppId)
      setDpps(prev => prev.filter(d => d.id !== dppId))
    } catch (err) {
      alert('Error deleting: ' + err.message)
    } finally {
      setDeleting(null)
    }
  }

  const subjectColor = (id) => {
    if (!id) return 'bg-gray-100 text-gray-600'
    if (id.startsWith('phy'))  return 'bg-orange-50 text-orange-600'
    if (id.startsWith('chem')) return 'bg-cyan-50 text-cyan-700'
    if (id.startsWith('math')) return 'bg-purple-50 text-purple-600'
    return 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Daily Practice Problems</h1>
          <p className="text-xs text-gray-400 mt-0.5">Assign DPPs from the question bank to your batch</p>
        </div>
        <BatchSelector value={batch} onChange={setBatch} />
        {batch && (
          <button className="btn-primary" onClick={() => setShow(true)}>
            + Assign DPP
          </button>
        )}
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        {!batch ? (
          <div className="px-5 py-12 text-center text-gray-400">
            <p className="text-3xl mb-2">📋</p>
            <p className="font-medium">Select a batch to view DPPs</p>
          </div>
        ) : loading ? (
          <div className="px-5 py-12 text-center text-gray-400">Loading...</div>
        ) : dpps.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-400">
            <p className="text-4xl mb-3">📝</p>
            <p className="font-medium">No DPPs assigned yet</p>
            <p className="text-sm mt-1">Click "Assign DPP" to create your first one</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {dpps.map(d => {
              const isPast = d.dueAt && new Date(d.dueAt) < new Date()
              return (
                <div key={d.id} className="px-5 py-4 flex items-center gap-4">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${subjectColor(d.chapterId)}`}>
                    {d.chapterId?.startsWith('phy') ? '⚡' : d.chapterId?.startsWith('chem') ? '🧪' : '📐'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{d.title}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{d.questionCount} questions</span>
                      {d.attemptCount > 0 && (
                        <span className="text-xs text-gray-400">· {d.attemptCount} attempts</span>
                      )}
                      {d.avgScore != null && (
                        <span className="text-xs text-gray-400">· avg {d.avgScore.toFixed(0)}%</span>
                      )}
                      {d.dueAt && (
                        <span className={`text-xs ${isPast ? 'text-red-400' : 'text-amber-500'}`}>
                          · Due {new Date(d.dueAt).toLocaleDateString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Attempt badge */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {d.attemptCount > 0 ? (
                      <span className="badge-green">{d.attemptCount} done</span>
                    ) : (
                      <span className="badge-yellow">Pending</span>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(d.id)}
                      disabled={deleting === d.id}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                      title="Delete DPP"
                    >
                      {deleting === d.id ? '...' : '🗑️'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create modal */}
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="card w-full max-w-md p-6">
            <h2 className="font-bold text-gray-900 mb-1">Assign DPP</h2>
            <p className="text-xs text-gray-400 mb-4">Questions are picked randomly from the selected chapter</p>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Subject + Chapter selector */}
              <div>
                <label className="label">Subject & Chapter</label>
                <select
                  className="input"
                  value={form.chapterId}
                  onChange={e => setForm(f => ({ ...f, chapterId: e.target.value }))}
                  required
                >
                  <option value="">Select chapter...</option>
                  {SUBJECTS.map(s => (
                    <optgroup key={s.prefix} label={s.label}>
                      {Array.from({ length: s.chapters }, (_, i) => {
                        const id = `${s.prefix}_ch${i + 1}`
                        return (
                          <option key={id} value={id}>
                            {s.label} — Chapter {i + 1}
                          </option>
                        )
                      })}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="label">DPP Title</label>
                <input
                  className="input"
                  placeholder="e.g. Physics Chapter 3 DPP"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required
                />
              </div>

              {/* Question count + due date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">No. of Questions</label>
                  <input
                    className="input"
                    type="number"
                    min="5"
                    max="30"
                    value={form.questionCount}
                    onChange={e => setForm(f => ({ ...f, questionCount: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Due Date (optional)</label>
                  <input
                    className="input"
                    type="datetime-local"
                    value={form.dueAt}
                    onChange={e => setForm(f => ({ ...f, dueAt: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  className="btn-outline flex-1"
                  onClick={() => { setShow(false); setForm(empty) }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={saving}
                >
                  {saving ? 'Assigning...' : 'Assign DPP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
