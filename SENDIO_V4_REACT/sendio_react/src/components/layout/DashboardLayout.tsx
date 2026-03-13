import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

const PAGE_TITLES: Record<string, string> = {
  '/campaigns': 'Campaigns',
  '/analytics': 'Analytics',
  '/inbox': 'Inbox',
  '/accounts': 'Email Accounts',
  '/warmup': 'Email Warmup',
  '/webhooks': 'Webhooks',
  '/crm': 'CRM',
  '/integrations': 'Integrations',
  '/users': 'User Management',
  '/unsubscribes': 'Unsubscribes',
}

export function DashboardLayout() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const title = PAGE_TITLES[location.pathname] || 'Sendio'

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#07101e' }}>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col" style={{ width: 240, flexShrink: 0 }}>
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 flex flex-col" style={{ width: 240 }}>
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-4 px-6 py-4 flex-shrink-0" style={{ background: '#0d1829', borderBottom: '1px solid rgba(99,102,241,0.1)', height: 64 }}>
          <button
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={20} />
          </button>
          <h1 className="text-lg font-semibold text-white">{title}</h1>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
