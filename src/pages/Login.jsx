import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api'

export default function Login() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(phone.trim(), code.trim().toUpperCase())
      localStorage.setItem('adminPhone',   data.adminPhone)
      localStorage.setItem('coachingId',   data.coachingId)
      localStorage.setItem('coachingName', data.coachingName)
      navigate('/dashboard')
    } catch {
      setError('Invalid phone or coaching code. Please check with your admin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 to-white">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white font-black text-3xl mx-auto mb-4 shadow-lg shadow-indigo-200">J</div>
          <h1 className="text-2xl font-bold text-gray-900">JEEAce Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Coaching Management Portal</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Admin Phone</label>
              <input
                className="input"
                type="tel"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Coaching Code</label>
              <input
                className="input uppercase"
                type="text"
                placeholder="e.g. ALLEN-2025"
                value={code}
                onChange={e => setCode(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
              {loading ? 'Verifying...' : 'Login →'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          JEEAce · Admin Portal · Only for authorized staff
        </p>
      </div>
    </div>
  )
}
