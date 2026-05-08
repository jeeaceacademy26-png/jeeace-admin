import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Announcements from './pages/Announcements'
import Tests from './pages/Tests'
import Dpps from './pages/Dpps'
import Schedule from './pages/Schedule'
import Materials from './pages/Materials'
import Syllabus from './pages/Syllabus'
import Attendance from './pages/Attendance'
import Analytics from './pages/Analytics'
import Fees from './pages/Fees'

function isLoggedIn() {
  return !!localStorage.getItem('adminPhone') && !!localStorage.getItem('coachingId')
}

function PrivateRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"     element={<Dashboard />} />
        <Route path="students"      element={<Students />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="tests"         element={<Tests />} />
        <Route path="dpps"          element={<Dpps />} />
        <Route path="schedule"      element={<Schedule />} />
        <Route path="materials"     element={<Materials />} />
        <Route path="syllabus"      element={<Syllabus />} />
        <Route path="attendance"    element={<Attendance />} />
        <Route path="analytics"     element={<Analytics />} />
        <Route path="fees"          element={<Fees />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
