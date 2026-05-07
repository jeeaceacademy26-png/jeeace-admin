import { useEffect, useState } from 'react'
import BatchSelector from '../components/BatchSelector'
import { getSyllabus, updateSyllabus } from '../api'

export default function Syllabus() {
  const [batch, setBatch]     = useState(null)
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving]   = useState('')

  useEffect(() => {
    if (!batch) return
    setLoading(true)
    getSyllabus(batch.id)
      .then(d => setItems(d.syllabus || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [batch])

  async function handleUpdate(item, coverage, completed) {
    setSaving(item.id)
    try {
      await updateSyllabus(item.id, coverage, completed)
      setItems(prev => prev.map(i => i.id === item.id ? {...i, coverage, completed} : i))
    } catch (err) { alert('Error: ' + err.message) }
    finally { setSaving('') }
  }

  const grouped = items.reduce((acc, item) => {
    if (!acc[item.subject]) acc[item.subject] = []
    acc[item.subject].push(item)
    return acc
  }, {})

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1"><h1 className="text-xl font-bold text-gray-900">Syllabus Coverage</h1></div>
        <BatchSelector value={batch} onChange={setBatch} />
      </div>

      {!batch ? (
        <div className="card px-5 py-12 text-center text-gray-400">Select a batch above</div>
      ) : loading ? (
        <div className="card px-5 py-12 text-center text-gray-400">Loading...</div>
      ) : items.length === 0 ? (
        <div className="card px-5 py-12 text-center text-gray-400">
          <p className="text-4xl mb-3">📚</p>
          <p className="font-medium">No syllabus items</p>
          <p className="text-sm mt-1">Syllabus items are auto-created when students attempt DPPs for each chapter</p>
        </div>
      ) : Object.entries(grouped).map(([subject, chapters]) => (
        <div key={subject} className="card overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">{subject}</p>
            <p className="text-xs text-gray-400">
              {chapters.filter(c => c.completed).length}/{chapters.length} completed
            </p>
          </div>
          <div className="divide-y divide-gray-50">
            {chapters.map(item => (
              <div key={item.id} className="px-5 py-4">
                <div className="flex items-center gap-3 mb-2">
                  <input type="checkbox" className="w-4 h-4 accent-primary"
                    checked={item.completed}
                    onChange={e => handleUpdate(item, item.coverage, e.target.checked)}
                    disabled={saving === item.id} />
                  <span className={`text-sm font-medium flex-1 ${item.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                    {item.chapter}
                  </span>
                  <span className="text-sm font-bold text-gray-600">{item.coverage}%</span>
                </div>
                <div className="flex items-center gap-3 ml-7">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{width: `${item.coverage}%`}} />
                  </div>
                  <input type="range" min="0" max="100" step="5"
                    className="w-24 accent-primary"
                    value={item.coverage}
                    onChange={e => handleUpdate(item, Number(e.target.value), item.completed)}
                    disabled={saving === item.id} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
