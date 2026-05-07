import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import BatchSelector from '../components/BatchSelector'
import { getLeaderboard, getScoreHistory } from '../api'

export default function Analytics() {
  const [batch, setBatch]           = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [scoreHistory, setScoreHistory] = useState([])
  const [loading, setLoading]       = useState(false)

  useEffect(() => {
    if (!batch) return
    setLoading(true)
    Promise.all([getLeaderboard(batch.id), getScoreHistory(batch.id)])
      .then(([l, s]) => {
        setLeaderboard(l.leaderboard || [])
        setScoreHistory(s.history || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [batch])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1"><h1 className="text-xl font-bold text-gray-900">Analytics</h1></div>
        <BatchSelector value={batch} onChange={setBatch} />
      </div>

      {!batch ? (
        <div className="card px-5 py-12 text-center text-gray-400">Select a batch above</div>
      ) : loading ? (
        <div className="card px-5 py-12 text-center text-gray-400">Loading...</div>
      ) : (
        <>
          {/* Score trend chart */}
          {scoreHistory.length > 0 && (
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Batch Score Trend</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={scoreHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="testLabel" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={v => `${v}%`} />
                  <Line type="monotone" dataKey="scorePct" stroke="#6366F1" strokeWidth={2} dot={{ r: 4 }} name="Your Score" />
                  <Line type="monotone" dataKey="batchAvgPct" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 4" dot={false} name="Batch Avg" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Leaderboard */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Batch Leaderboard</h2>
            </div>
            {leaderboard.length === 0 ? (
              <div className="px-5 py-12 text-center text-gray-400">
                <p className="text-4xl mb-3">📈</p>
                <p className="font-medium">No data yet</p>
                <p className="text-sm mt-1">Leaderboard appears after students submit DPPs</p>
              </div>
            ) : (
              <>
                <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-100 grid grid-cols-12 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <span className="col-span-1">#</span>
                  <span className="col-span-6">Student</span>
                  <span className="col-span-3 text-center">Accuracy</span>
                  <span className="col-span-2 text-center">Qs Done</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {leaderboard.map((e, i) => (
                    <div key={e.rank} className={`px-5 py-3.5 grid grid-cols-12 items-center ${i < 3 ? 'bg-indigo-50/30' : ''}`}>
                      <span className={`col-span-1 text-sm font-bold ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-400' : 'text-gray-400'}`}>
                        {i < 3 ? ['🥇','🥈','🥉'][i] : `#${e.rank}`}
                      </span>
                      <span className="col-span-6 text-sm font-medium text-gray-800">{e.name}</span>
                      <span className={`col-span-3 text-sm font-bold text-center ${e.accuracy >= 70 ? 'text-green-600' : e.accuracy >= 45 ? 'text-yellow-600' : 'text-red-500'}`}>
                        {e.accuracy}%
                      </span>
                      <span className="col-span-2 text-xs text-gray-400 text-center">{e.questionsAttempted}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
