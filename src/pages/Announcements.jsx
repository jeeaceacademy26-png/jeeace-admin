import { useEffect, useState } from 'react'
import BatchSelector from '../components/BatchSelector'
import { getAnnouncements, postAnnouncement } from '../api'

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function Announcements() {
  const [batch, setBatch]             = useState(null)
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading]         = useState(false)
  const [show, setShow]               = useState(false)
  const [form, setForm]               = useState({ text: '', isPinned: false })
  const [saving, setSaving]           = useState(false)

  useEffect(() => {
    if (!batch) return
    setLoading(true)
    getAnnouncements(batch.id)
      .then(d => setAnnouncements(d.announcements || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [batch])

  async function handlePost(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await postAnnouncement(batch.id, form.text, form.isPinned)
      const d = await getAnnouncements(batch.id)
      setAnnouncements(d.announcements || [])
      setShow(false)
      setForm({ text: '', isPinned: false })
    } catch (err) { alert('Error: ' + err.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Announcements</h1>
        </div>
        <BatchSelector value={batch} onChange={setBatch} />
        {batch && <button className="btn-primary" onClick={() => setShow(true)}>+ New Announcement</button>}
      </div>

      <div className="space-y-3">
        {!batch ? (
          <div className="card px-5 py-12 text-center text-gray-400">Select a batch above</div>
        ) : loading ? (
          <div className="card px-5 py-12 text-center text-gray-400">Loading...</div>
        ) : announcements.length === 0 ? (
          <div className="card px-5 py-12 text-center text-gray-400">
            <p className="text-4xl mb-3">📢</p>
            <p className="font-medium">No announcements yet</p>
          </div>
        ) : announcements.map(a => (
          <div key={a.id} className={`card p-5 ${a.isPinned ? 'border-yellow-200 bg-yellow-50/30' : ''}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-gray-500">{a.postedBy}</span>
              {a.isPinned && <span className="badge-yellow">📌 Pinned</span>}
              <span className="text-xs text-gray-400 ml-auto">{timeAgo(a.createdAt)}</span>
            </div>
            <p className="text-sm text-gray-800 leading-relaxed">{a.text}</p>
          </div>
        ))}
      </div>

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="card w-full max-w-lg p-6">
            <h2 className="font-bold text-gray-900 mb-4">Post Announcement</h2>
            <form onSubmit={handlePost} className="space-y-4">
              <div>
                <label className="label">Message</label>
                <textarea
                  className="input h-32 resize-none"
                  placeholder="Type your announcement here..."
                  value={form.text}
                  onChange={e => setForm(f => ({...f, text: e.target.value}))}
                  required
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-primary"
                  checked={form.isPinned} onChange={e => setForm(f => ({...f, isPinned: e.target.checked}))} />
                <span className="text-sm font-medium text-gray-700">📌 Pin this announcement</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" className="btn-outline flex-1" onClick={() => setShow(false)}>Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? 'Posting...' : 'Post'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
