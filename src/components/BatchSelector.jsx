import { useEffect, useState } from 'react'
import { getBatches } from '../api'

export default function BatchSelector({ value, onChange }) {
  const [batches, setBatches] = useState([])

  useEffect(() => {
    getBatches().then(d => {
      const list = d.batches || []
      setBatches(list)
      if (!value && list.length) {
        onChange(list[0])
        localStorage.setItem('activeBatchName', list[0].name)
      }
    }).catch(() => {})
  }, [])

  if (!batches.length) return null

  return (
    <select
      className="input w-auto text-sm font-medium"
      value={value?.id || ''}
      onChange={e => {
        const b = batches.find(b => b.id === e.target.value)
        if (b) { onChange(b); localStorage.setItem('activeBatchName', b.name) }
      }}
    >
      {batches.map(b => (
        <option key={b.id} value={b.id}>{b.name}</option>
      ))}
    </select>
  )
}
