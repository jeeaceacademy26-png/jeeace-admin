import { useEffect, useState } from 'react'
import BatchSelector from '../components/BatchSelector'
import { getTests, createTest } from '../api'

export default function Tests() {
  const [batch, setBatch]   = useState(null)
  const [tests, setTests]   = useState([])
  const [loading, setLoading] = useState(false)
  const [show, setShow]     = useState(false)
  const [form, setForm]     = useState({ title: '', chapterId: '', durationMinutes: 30, totalQuestions: 15, dueAt: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!batch) return
    setLoading(true)
    getTests(batch.id)
      .then(d => setTests(d.tests || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [batch])

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await createTest(batch.id, {
        title: form.title,
        chapterId: form.chapterId,
        durationMinutes: Number(form.durationMinutes),
        totalQuestions: Number(form.totalQuestions),
        dueAt: form.dueAt || null,
      })
      const d = await getTests(batch.id)
      setTests(d.tests || [])
      setShow(false)
      setForm({ title: '', chapterId: '', durationMinutes: 30, totalQuestions: 15, dueAt: '' })
    } catch (err) { alert('Error: ' + err.message) }
    finally { setSaving(false) }
  }

  function statusBadge(t) {
    if (t.attempted) return <span className="badge-green">Attempted</span>
    if (t.dueAt && new Date(t.dueAt) < new Date()) return <span className="badge-red">Expired</span>
    return <span className="badge-yellow">Pending</span>
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1"><h1 className="text-xl font-bold text-gray-900">Tests</h1></div>
        <BatchSelector value={batch} onChange={setBatch} />
        {batch && <button className="btn-primary" onClick={() => setShow(true)}>+ Create Test</button>}
      </div>

      <div className="card overflow-hidden">
        {!batch ? (
          <div className="px-5 py-12 text-center text-gray-400">Select a batch above</div>
        ) : loading ? (
          <div className="px-5 py-12 text-center text-gray-400">Loading...</div>
        ) : tests.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-400">
            <p className="text-4xl mb-3">📝</p>
            <p className="font-medium">No tests created yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {tests.map(t => (
              <div key={t.id} className="px-5 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 text-xl">📝</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{t.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {t.durationMinutes} min · {t.totalQuestions} questions
                    {t.dueAt && ` · Due ${new Date(t.dueAt).toLocaleDateString('en-IN')}`}
                  </p>
                </div>
                {statusBadge(t)}
              </div>
            ))}
          </div>
        )}
      </div>

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="card w-full max-w-md p-6">
            <h2 className="font-bold text-gray-900 mb-4">Create Test</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">Test Title</label>
                <input className="input" placeholder="e.g. Physics Unit Test 1"
                  value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required />
              </div>
              <div>
                <label className="label">Chapter ID <span className="text-gray-400 normal-case font-normal">(from question bank)</span></label>
                <input className="input font-mono" placeholder="e.g. phy-motion"
                  value={form.chapterId} onChange={e => setForm(f => ({...f, chapterId: e.target.value}))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Duration (min)</label>
                  <input className="input" type="number" min="5" max="180"
                    value={form.durationMinutes} onChange={e => setForm(f => ({...f, durationMinutes: e.target.value}))} />
                </div>
                <div>
                  <label className="label">Questions</label>
                  <input className="input" type="number" min="1" max="100"
                    value={form.totalQuestions} onChange={e => setForm(f => ({...f, totalQuestions: e.target.value}))} />
                </div>
              </div>
              <div>
                <label className="label">Due Date (optional)</label>
                <input className="input" type="datetime-local"
                  value={form.dueAt} onChange={e => setForm(f => ({...f, dueAt: e.target.value}))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" className="btn-outline flex-1" onClick={() => setShow(false)}>Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
