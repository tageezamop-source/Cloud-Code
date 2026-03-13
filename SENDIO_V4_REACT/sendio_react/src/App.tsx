import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { DashboardLayout } from './components/layout/DashboardLayout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Campaigns from './pages/Campaigns'
import Analytics from './pages/Analytics'
import Inbox from './pages/Inbox'
import Accounts from './pages/Accounts'
import Warmup from './pages/Warmup'
import Webhooks from './pages/Webhooks'
import CRM from './pages/CRM'
import Integrations from './pages/Integrations'
import Users from './pages/Users'
import Unsubscribes from './pages/Unsubscribes'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen" style={{ background: '#07101e' }}>
    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
  </div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/campaigns" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/campaigns" replace /> : <Landing />} />
      <Route path="/login" element={user ? <Navigate to="/campaigns" replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/campaigns" replace /> : <Signup />} />

      <Route path="/" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="inbox" element={<Inbox />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="warmup" element={<Warmup />} />
        <Route path="webhooks" element={<Webhooks />} />
        <Route path="crm" element={<CRM />} />
        <Route path="integrations" element={<Integrations />} />
        <Route path="users" element={<AdminRoute><Users /></AdminRoute>} />
        <Route path="unsubscribes" element={<AdminRoute><Unsubscribes /></AdminRoute>} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
