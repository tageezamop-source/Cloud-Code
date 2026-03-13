import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import {
  Mail, BarChart2, Inbox, Users, Zap, Settings, Globe,
  Link, LogOut, Shield, Ban, Thermometer, Server
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

interface SidebarProps {
  onClose?: () => void
}

export default function Sidebar({ onClose }: SidebarProps) {
  const { user, logout, isAdmin } = useAuth()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    api.get('/inbox').then((d: { unread: number }) => setUnread(d.unread || 0)).catch(() => {})
    const interval = setInterval(() => {
      api.get('/inbox').then((d: { unread: number }) => setUnread(d.unread || 0)).catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = async () => {
    await logout()
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
    ${isActive
      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
    }`

  return (
    <div className="flex flex-col h-full" style={{ background: '#0d1829', borderRight: '1px solid rgba(99,102,241,0.12)' }}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5" style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          <Mail size={16} className="text-white" />
        </div>
        <span className="text-lg font-bold text-white tracking-tight">Sendio</span>
        {isAdmin && (
          <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full text-indigo-300" style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)' }}>
            ADMIN
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Core */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider px-3 mb-2" style={{ color: '#4a5578' }}>Core</p>
          <div className="space-y-0.5">
            {NAV_CORE.map(({ path, label, icon: Icon }) => (
              <NavLink key={path} to={path} className={linkClass} onClick={onClose}>
                <Icon size={16} />
                <span>{label}</span>
                {path === '/inbox' && unread > 0 && (
                  <span className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full bg-indigo-600 text-white min-w-[20px] text-center">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Power Tools */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider px-3 mb-2" style={{ color: '#4a5578' }}>Power Tools</p>
          <div className="space-y-0.5">
            {NAV_POWER.map(({ path, label, icon: Icon }) => (
              <NavLink key={path} to={path} className={linkClass} onClick={onClose}>
                <Icon size={16} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </div>

        {/* Admin */}
        {isAdmin && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider px-3 mb-2" style={{ color: '#4a5578' }}>Admin</p>
            <div className="space-y-0.5">
              {NAV_ADMIN.map(({ path, label, icon: Icon }) => (
                <NavLink key={path} to={path} className={linkClass} onClick={onClose}>
                  <Icon size={16} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(99,102,241,0.1)' }}>
        <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-xl" style={{ background: '#131f35' }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{user?.username}</p>
            <p className="text-xs" style={{ color: '#4a5578' }}>{user?.role}</p>
          </div>
          <NavLink to="/integrations" onClick={onClose}>
            <Settings size={15} className="text-slate-500 hover:text-slate-300 transition-colors" />
          </NavLink>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={16} />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  )
}
