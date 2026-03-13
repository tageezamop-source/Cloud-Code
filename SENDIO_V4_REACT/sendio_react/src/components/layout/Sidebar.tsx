import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import {
  Mail, BarChart2, Inbox, Users, Zap, Settings, Link,
  LogOut, Shield, Ban, Thermometer, Server, ChevronRight
} from 'lucide-react'

const NAV_CORE = [
  { path: '/campaigns', label: 'Campaigns', icon: Mail },
  { path: '/analytics', label: 'Analytics', icon: BarChart2 },
  { path: '/crm', label: 'CRM', icon: Users },
  { path: '/inbox', label: 'Inbox', icon: Inbox },
]
const NAV_POWER = [
  { path: '/warmup', label: 'Email Warmup', icon: Thermometer },
  { path: '/accounts', label: 'Email Accounts', icon: Server },
  { path: '/webhooks', label: 'Webhooks', icon: Zap },
  { path: '/integrations', label: 'Integrations', icon: Link },
]
const NAV_ADMIN = [
  { path: '/users', label: 'Users', icon: Shield },
  { path: '/unsubscribes', label: 'Unsubscribes', icon: Ban },
]

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, logout, isAdmin } = useAuth()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    const fetch = () => api.get('/inbox').then((d: { unread: number }) => setUnread(d.unread || 0)).catch(() => {})
    fetch()
    const t = setInterval(fetch, 30000)
    return () => clearInterval(t)
  }, [])

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all nav-item ${
      isActive
        ? 'bg-primary-light text-primary'
        : 'text-muted hover:bg-gray-50 hover:text-gray-800'
    }`

  const section = (label: string, items: typeof NAV_CORE) => (
    <div className="mb-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 px-3 mb-1">{label}</p>
      {items.map(({ path, label: lbl, icon: Icon }) => (
        <NavLink key={path} to={path} className={linkCls} onClick={onClose}>
          <Icon size={16} />
          <span className="flex-1">{lbl}</span>
          {path === '/inbox' && unread > 0 && (
            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-primary text-white min-w-[20px] text-center">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </NavLink>
      ))}
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-white" style={{ borderRight: '1px solid #e2e8f0' }}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5" style={{ borderBottom: '1px solid #e2e8f0' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-primary">
          <Mail size={15} className="text-white" />
        </div>
        <span className="text-lg font-bold text-gray-900 tracking-tight">Sendio</span>
        {isAdmin && (
          <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-light text-primary">ADMIN</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {section('Core', NAV_CORE)}
        {section('Power Tools', NAV_POWER)}
        {isAdmin && section('Admin', NAV_ADMIN)}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3" style={{ borderTop: '1px solid #e2e8f0' }}>
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-gray-50 mb-1">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white bg-primary">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{user?.username}</p>
            <p className="text-xs text-gray-400">{user?.role}</p>
          </div>
          <NavLink to="/integrations" onClick={onClose}>
            <Settings size={14} className="text-gray-400 hover:text-primary transition-colors" />
          </NavLink>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut size={15} />Sign out
        </button>
      </div>
    </div>
  )
}
