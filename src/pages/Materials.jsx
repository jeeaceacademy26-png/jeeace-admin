import { useEffect, useState } from 'react'
import BatchSelector from '../components/BatchSelector'
import { getMaterials, addMaterial, deleteMaterial } from '../api'

const FILE_ICONS = { pdf: '📄', doc: '📝', image: '🖼️', video: '🎬', link: '🔗' }

export default function Materials() {
  const [batch, setBatch]       = useState(null)
  const [materials, setMaterials] = useState([])
  const [loading, setLoading]   = useState(false)
  const [show, setShow]         = useState(false)
  const [form, setForm]         = useState({ title: '', subject: 'Physics', fileType: 'pdf', url: '' })
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState('')

  useEffect(() => {
    if (!batch) return
    setLoading(true)
    getMaterials(batch.id)
      .then(d => setMaterials(d.materials || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [batch])

  async function handleAdd(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await addMaterial(batch.id, form)
      const d = await getMaterials(batch.id)
      setMaterials(d.materials || [])
      setShow(false)
      setForm({ title: '', subject: 'Physics', fileType: 'pdf', url: '' })
    } catch (err) { alert('Error: ' + err.message) }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('Remove this material?')) return
    setDeleting(id)
    try {
      await deleteMaterial(id)
      setMaterials(m => m.filter(x => x.id !== id))
    } catch (err) { alert('Error: ' + err.message) }
    finally { setDeleting('') }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1"><h1 className="text-xl font-bold text-gray-900">Study Materials</h1></div>
        <BatchSelector value={batch} onChange={setBatch} />
        {batch && <button className="btn-primary" onClick={() => setShow(true)}>+ Add Material</button>}
      </div>

      <div className="card overflow-hidden">
        {!batch ? (
          <div className="px-5 py-12 text-center text-gray-400">Select a batch above</div>
        ) : loading ? (
          <div className="px-5 py-12 text-center text-gray-400">Loading...</div>
        ) : materials.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-400">
            <p className="text-4xl mb-3">📁</p><p className="font-medium">No materials uploaded yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {materials.map(m => (
              <div key={m.id} className="px-5 py-4 flex items-center gap-3">
                <span className="text-2xl">{FILE_ICONS[m.fileType] || '📄'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{m.title}</p>
                  <p className="text-xs text-gray-400">{m.subject} · {m.uploadedBy}</p>
                </div>
                <a href={m.url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-primary font-medium hover:underline">Open ↗</a>
                <button onClick={() => handleDelete(m.id)} disabled={deleting === m.id}
                  className="text-xs text-red-400 hover:text-red-600 disabled:opacity-40 ml-2">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="card w-full max-w-md p-6">
            <h2 className="font-bold text-gray-900 mb-4">Add Study Material</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="label">Title</label>
                <input className="input" placeholder="e.g. Electrostatics Notes" value={form.title}
                  onChange={e => setForm(f => ({...f, title: e.target.value}))} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Subject</label>
                  <select className="input" value={form.subject} onChange={e => setForm(f => ({...f, subject: e.target.value}))}>
                    {['Physics','Chemistry','Mathematics','Biology'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Type</label>
                  <select className="input" value={form.fileType} onChange={e => setForm(f => ({...f, fileType: e.target.value}))}>
                    {['pdf','doc','image','video','link'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">URL / Link</label>
                <input className="input" type="url" placeholder="https://drive.google.com/..." value={form.url}
                  onChange={e => setForm(f => ({...f, url: e.target.value}))} required />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" className="btn-outline flex-1" onClick={() => setShow(false)}>Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? 'Adding...' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
