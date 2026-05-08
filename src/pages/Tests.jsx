import { useEffect, useState } from 'react'
import BatchSelector from '../components/BatchSelector'
import { getTests, createTest, deleteTest, getTestAttempts, searchQuestions } from '../api'

const SUBJECTS = ['physics', 'chemistry', 'mathematics']
const PAPER_TYPES = ['JEE Main', 'JEE Advanced', 'NEET', 'SSC CGL', 'SSC CHSL']

export default function Tests() {
  const [batch, setBatch]     = useState(null)
  const [tests, setTests]     = useState([])
  const [loading, setLoading] = useState(false)
  const [view, setView]       = useState('list') // 'list' | 'create' | 'results'
  const [selected, setSelected] = useState(null)
  const [attempts, setAttempts] = useState([])
  const [attLoading, setAttLoading] = useState(false)

  useEffect(() => {
    if (!batch) return
    load()
  }, [batch])

  function load() {
    setLoading(true)
    getTests(batch.id)
      .then(d => setTests(d.tests || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  async function openResults(t) {
    setSelected(t)
    setView('results')
    setAttLoading(true)
    try {
      const d = await getTestAttempts(t.id, batch.id)
      setAttempts(d.attempts || [])
    } catch { setAttempts([]) }
    setAttLoading(false)
  }

  async function handleDelete(t) {
    if (!confirm(`Delete "${t.title}"? This removes all student submissions too.`)) return
    try {
      await deleteTest(t.id)
      load()
    } catch (err) { alert('Error: ' + err.message) }
  }

  if (view === 'create') {
    return <CreateTestView batch={batch} onBack={() => { setView('list'); load() }} />
  }

  if (view === 'results') {
    return <ResultsView test={selected} attempts={attempts} loading={attLoading} onBack={() => setView('list')} />
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1"><h1 className="text-xl font-bold text-gray-900">Tests</h1></div>
        <BatchSelector value={batch} onChange={setBatch} />
        {batch && <button className="btn-primary" onClick={() => setView('create')}>+ Create Test</button>}
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
                <button className="text-xs text-blue-600 font-medium hover:underline" onClick={() => openResults(t)}>Results</button>
                <button className="text-xs text-red-400 hover:text-red-600" onClick={() => handleDelete(t)}>Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Create Test ────────────────────────────────────────────────────────────────
function CreateTestView({ batch, onBack }) {
  const [step, setStep]           = useState(1) // 1=details, 2=questions, 3=confirm
  const [form, setForm]           = useState({
    title: '', durationMinutes: 180, correctMarks: 4, wrongMarks: -1, dueAt: '',
  })
  const [searchSub, setSearchSub] = useState('physics')
  const [searchType, setSearchType] = useState('JEE Main')
  const [searchCount, setSearchCount] = useState(30)
  const [pool, setPool]           = useState([])
  const [picked, setPicked]       = useState([]) // [{id, question, options, subject}]
  const [searching, setSearching] = useState(false)
  const [saving, setSaving]       = useState(false)

  async function fetchPool() {
    setSearching(true)
    try {
      const d = await searchQuestions({ subject: searchSub, paperType: searchType, count: searchCount })
      setPool(d.questions || [])
    } catch (err) { alert(err.message) }
    setSearching(false)
  }

  function togglePick(q) {
    setPicked(prev => prev.find(p => p.id === q.id) ? prev.filter(p => p.id !== q.id) : [...prev, q])
  }

  async function handleCreate() {
    if (!form.title.trim()) return alert('Title required')
    if (picked.length === 0) return alert('Pick at least 1 question')
    setSaving(true)
    try {
      await createTest(batch.id, {
        title:           form.title,
        durationMinutes: Number(form.durationMinutes),
        totalQuestions:  picked.length,
        questionIds:     picked.map(q => q.id),
        correctMarks:    Number(form.correctMarks),
        wrongMarks:      Number(form.wrongMarks),
        dueAt:           form.dueAt || null,
      })
      onBack()
    } catch (err) { alert('Error: ' + err.message) }
    setSaving(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700">← Back</button>
        <h1 className="text-xl font-bold text-gray-900 flex-1">Create Test</h1>
        {step === 2 && picked.length > 0 && (
          <span className="text-sm text-blue-600 font-medium">{picked.length} selected</span>
        )}
      </div>

      {/* Step tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {['Details', 'Pick Questions', 'Confirm'].map((s, i) => (
          <button key={s} onClick={() => setStep(i + 1)}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${step === i + 1 ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
            {i + 1}. {s}
          </button>
        ))}
      </div>

      {step === 1 && (
        <div className="card p-6 max-w-lg space-y-4">
          <div>
            <label className="label">Test Title</label>
            <input className="input" placeholder="e.g. Physics Full Syllabus Mock 1"
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Duration (minutes)</label>
              <input className="input" type="number" min="10" max="360"
                value={form.durationMinutes} onChange={e => setForm(f => ({ ...f, durationMinutes: e.target.value }))} />
            </div>
            <div>
              <label className="label">Due Date (optional)</label>
              <input className="input" type="datetime-local"
                value={form.dueAt} onChange={e => setForm(f => ({ ...f, dueAt: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Marks per Correct</label>
              <input className="input" type="number" step="0.5"
                value={form.correctMarks} onChange={e => setForm(f => ({ ...f, correctMarks: e.target.value }))} />
            </div>
            <div>
              <label className="label">Marks per Wrong</label>
              <input className="input" type="number" step="0.5"
                value={form.wrongMarks} onChange={e => setForm(f => ({ ...f, wrongMarks: e.target.value }))} />
            </div>
          </div>
          <button className="btn-primary w-full" onClick={() => setStep(2)}>Next → Pick Questions</button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="card p-4 flex flex-wrap gap-3 items-end">
            <div>
              <label className="label">Subject</label>
              <select className="input" value={searchSub} onChange={e => setSearchSub(e.target.value)}>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Paper Type</label>
              <select className="input" value={searchType} onChange={e => setSearchType(e.target.value)}>
                {PAPER_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Load</label>
              <select className="input" value={searchCount} onChange={e => setSearchCount(e.target.value)}>
                {[20, 30, 50, 75, 90].map(n => <option key={n} value={n}>{n} questions</option>)}
              </select>
            </div>
            <button className="btn-primary" onClick={fetchPool} disabled={searching}>
              {searching ? 'Loading…' : 'Fetch Questions'}
            </button>
          </div>

          {pool.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{pool.length} questions — click to select/deselect</span>
                <div className="flex gap-2">
                  <button className="text-xs text-blue-600" onClick={() => setPicked(prev => {
                    const newOnes = pool.filter(q => !prev.find(p => p.id === q.id))
                    return [...prev, ...newOnes]
                  })}>Select All</button>
                  <button className="text-xs text-gray-500" onClick={() => setPicked(prev => prev.filter(p => !pool.find(q => q.id === p.id)))}>Deselect All</button>
                </div>
              </div>
              <div className="divide-y divide-gray-50 max-h-[60vh] overflow-y-auto">
                {pool.map((q, idx) => {
                  const isPicked = picked.find(p => p.id === q.id)
                  return (
                    <div key={q.id} onClick={() => togglePick(q)}
                      className={`px-4 py-3 cursor-pointer flex gap-3 transition-colors ${isPicked ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                      <div className={`w-5 h-5 mt-0.5 rounded flex-shrink-0 border-2 flex items-center justify-center ${isPicked ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                        {isPicked && <span className="text-white text-xs">✓</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 mb-0.5">Q{idx + 1} · {q.subject}</p>
                        <p className="text-sm text-gray-800 line-clamp-2">{q.question}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button className="btn-outline" onClick={() => setStep(1)}>← Back</button>
            <button className="btn-primary flex-1" onClick={() => setStep(3)} disabled={picked.length === 0}>
              Continue with {picked.length} questions →
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card p-6 max-w-lg space-y-4">
          <h2 className="font-bold text-gray-900">Confirm Test Details</h2>
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Title</span><span className="font-semibold">{form.title}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Questions</span><span className="font-semibold">{picked.length}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Duration</span><span className="font-semibold">{form.durationMinutes} min</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Marking</span><span className="font-semibold">+{form.correctMarks} / {form.wrongMarks}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Max Marks</span><span className="font-semibold">{picked.length * Number(form.correctMarks)}</span></div>
            {form.dueAt && <div className="flex justify-between"><span className="text-gray-500">Due</span><span className="font-semibold">{new Date(form.dueAt).toLocaleString('en-IN')}</span></div>}
          </div>
          <div className="text-xs text-gray-400">
            Subjects: {[...new Set(picked.map(q => q.subject))].join(', ')}
          </div>
          <div className="flex gap-3 pt-2">
            <button className="btn-outline" onClick={() => setStep(2)}>← Edit Questions</button>
            <button className="btn-primary flex-1" onClick={handleCreate} disabled={saving}>
              {saving ? 'Creating…' : '✓ Create Test'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Results View ───────────────────────────────────────────────────────────────
function ResultsView({ test, attempts, loading, onBack }) {
  if (loading) return (
    <div className="space-y-5">
      <button onClick={onBack} className="text-gray-500 hover:text-gray-700">← Back to Tests</button>
      <div className="text-center py-12 text-gray-400">Loading results…</div>
    </div>
  )

  const avg = attempts.length
    ? Math.round(attempts.reduce((s, a) => s + a.scorePct, 0) / attempts.length)
    : 0

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700">← Back</button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{test?.title}</h1>
          <p className="text-xs text-gray-400">{test?.totalQuestions} questions · {test?.durationMinutes} min</p>
        </div>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{attempts.length}</p>
          <p className="text-xs text-gray-400 mt-1">Submitted</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{avg}%</p>
          <p className="text-xs text-gray-400 mt-1">Batch Avg</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{attempts[0]?.scorePct ?? '—'}%</p>
          <p className="text-xs text-gray-400 mt-1">Top Score</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        {attempts.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-400">No submissions yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Student</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Score</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">%</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {attempts.map(a => (
                <tr key={a.phone} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-bold text-gray-700">#{a.rank}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{a.name}</p>
                    <p className="text-xs text-gray-400">{a.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{a.score}/{a.total}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-bold ${a.scorePct >= 70 ? 'text-green-600' : a.scorePct >= 40 ? 'text-yellow-600' : 'text-red-500'}`}>
                      {a.scorePct}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400 text-xs">
                    {a.submittedAt ? new Date(a.submittedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
