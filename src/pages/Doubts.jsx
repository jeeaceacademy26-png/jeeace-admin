import { useEffect, useState } from 'react'
import BatchSelector from '../components/BatchSelector'
import { getDoubts, replyDoubt, closeDoubt } from '../api'

const SUBJECTS = ['All', 'Physics', 'Chemistry', 'Mathematics', 'General']

const statusBadge = (s) => {
  if (s === 'resolved') return <span className="badge-green">Resolved</span>
  if (s === 'answered') return <span className="badge-yellow">Answered</span>
  return <span className="badge-red">Open</span>
}

function timeAgo(iso) {
  const d = new Date(iso)
  const diff = Math.floor((Date.now() - d) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function Doubts() {
  const [batch, setBatch]       = useState(null)
  const [doubts, setDoubts]     = useState([])
  const [loading, setLoading]   = useState(false)
  const [tab, setTab]           = useState('open')     // 'open' | 'answered' | 'resolved'
  const [subFilter, setSubFilter] = useState('All')
  const [expanded, setExpanded] = useState(null)
  const [replyText, setReplyText] = useState({})
  const [saving, setSaving]     = useState(null)

  useEffect(() => { if (batch) load() }, [batch, tab])

  function load() {
    setLoading(true)
    const status = tab === 'all' ? undefined : tab
    getDoubts(batch.id, status)
      .then(d => setDoubts(d.doubts || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const filtered = subFilter === 'All' ? doubts : doubts.filter(d => d.subject === subFilter)

  async function handleReply(id) {
    const text = replyText[id]?.trim()
    if (!text) return
    setSaving(id)
    try {
      await replyDoubt(id, text)
      setReplyText(r => ({ ...r, [id]: '' }))
      load()
    } catch (err) { alert(err.message) }
    setSaving(null)
  }

  async function handleClose(id) {
    try {
      await closeDoubt(id)
      load()
    } catch (err) { alert(err.message) }
  }

  const open     = doubts.filter(d => d.status === 'open').length
  const answered = doubts.filter(d => d.status === 'answered').length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Doubts</h1>
          {batch && <p className="text-xs text-gray-400 mt-0.5">{open} open · {answered} awaiting review</p>}
        </div>
        <BatchSelector value={batch} onChange={b => { setBatch(b); setExpanded(null) }} />
      </div>

      {!batch ? (
        <div className="card px-5 py-12 text-center text-gray-400">Select a batch above</div>
      ) : (
        <>
          {/* Tabs + subject filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {[['open','Open'], ['answered','Answered'], ['resolved','Resolved']].map(([v, l]) => (
                <button key={v} onClick={() => setTab(v)}
                  className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-all ${tab === v ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
                  {l}
                </button>
              ))}
            </div>
            <select className="input text-sm" value={subFilter} onChange={e => setSubFilter(e.target.value)}
              style={{width: 'auto', padding: '6px 10px'}}>
              {SUBJECTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {/* List */}
          <div className="card overflow-hidden">
            {loading ? (
              <div className="px-5 py-12 text-center text-gray-400">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="px-5 py-12 text-center text-gray-400">
                <p className="text-3xl mb-2">🙌</p>
                <p className="font-medium">No {tab} doubts</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filtered.map(d => (
                  <div key={d.id} className="px-5 py-4">
                    {/* Doubt header */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-bold flex-shrink-0 mt-0.5">
                        {(d.studentName || '?')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900 text-sm">{d.studentName}</span>
                          <span className="text-xs text-gray-400">{timeAgo(d.createdAt)}</span>
                          <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-500">{d.subject}</span>
                          {statusBadge(d.status)}
                        </div>
                        <p className="text-sm text-gray-700 mt-1 leading-relaxed">{d.question}</p>

                        {/* Replies */}
                        {d.replies && d.replies.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {d.replies.map((r, i) => (
                              <div key={i} className="flex gap-2">
                                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs font-bold flex-shrink-0">F</div>
                                <div className="flex-1 bg-green-50 rounded-lg px-3 py-2">
                                  <p className="text-xs font-semibold text-green-700">{r.replied_by}</p>
                                  <p className="text-sm text-gray-700 mt-0.5">{r.text}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reply input */}
                        {d.status !== 'resolved' && (
                          <div className="mt-3">
                            {expanded === d.id ? (
                              <div className="space-y-2">
                                <textarea
                                  className="input text-sm w-full resize-none"
                                  rows={3}
                                  placeholder="Type your reply..."
                                  value={replyText[d.id] || ''}
                                  onChange={e => setReplyText(r => ({ ...r, [d.id]: e.target.value }))}
                                  autoFocus
                                />
                                <div className="flex gap-2">
                                  <button className="btn-primary text-xs py-1.5 px-3"
                                    onClick={() => handleReply(d.id)}
                                    disabled={saving === d.id || !replyText[d.id]?.trim()}>
                                    {saving === d.id ? 'Sending...' : 'Send Reply'}
                                  </button>
                                  {d.status === 'answered' && (
                                    <button className="text-xs text-green-600 font-medium hover:underline"
                                      onClick={() => handleClose(d.id)}>
                                      Mark Resolved
                                    </button>
                                  )}
                                  <button className="text-xs text-gray-400 hover:text-gray-600"
                                    onClick={() => setExpanded(null)}>
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-3">
                                <button className="text-xs text-indigo-600 font-medium hover:underline"
                                  onClick={() => setExpanded(d.id)}>
                                  {d.replies?.length > 0 ? 'Reply again' : 'Reply'}
                                </button>
                                {d.status === 'answered' && (
                                  <button className="text-xs text-green-600 font-medium hover:underline"
                                    onClick={() => handleClose(d.id)}>
                                    Mark Resolved
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
