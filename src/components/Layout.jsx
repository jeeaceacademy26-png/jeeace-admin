import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'

const nav = [
  { to: '/dashboard',     label: 'Dashboard',     icon: '📊' },
  { to: '/students',      label: 'Students',       icon: '👥' },
  { to: '/announcements', label: 'Announcements',  icon: '📢' },
  { to: '/tests',         label: 'Tests',          icon: '📝' },
  { to: '/dpps',          label: 'DPPs',           icon: '✏️' },
  { to: '/schedule',      label: 'Schedule',       icon: '🗓️' },
  { to: '/materials',     label: 'Materials',      icon: '📁' },
  { to: '/syllabus',      label: 'Syllabus',       icon: '📚' },
  { to: '/attendance',    label: 'Attendance',     icon: '✅' },
  { to: '/analytics',     label: 'Analytics',      icon: '📈' },
  { to: '/fees',          label: 'Fees',           icon: '💰' },
  { to: '/doubts',        label: 'Doubts',         icon: '❓' },
]

export default function Layout() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const coachingName = localStorage.getItem('coachingName') || 'Coaching'
  const batchName    = localStorage.getItem('activeBatchName') || ''

  function logout() {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-60 bg-white border-r border-gray-100 flex flex-col
        transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-black text-lg">PB</div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-tight">{coachingName}</p>
              {batchName && <p className="text-xs text-gray-400">{batchName}</p>}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primaryLight text-primary'
                    : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <span className="text-base">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-gray-100">
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all">
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {open && <div className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-gray-100 flex items-center px-4 gap-3 flex-shrink-0">
          <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setOpen(true)}>
            <span className="text-xl">☰</span>
          </button>
          <span className="text-sm font-semibold text-gray-700 flex-1">PadhaloBhai Admin</span>
          <span className="text-xs text-gray-400">{localStorage.getItem('adminPhone')}</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
