import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useState } from 'react'
import { Menu } from 'lucide-react'

const PAGE_TITLES: Record<string, string> = {
  '/campaigns':    'Campaigns',
  '/analytics':    'Analytics',
  '/inbox':        'Inbox',
  '/accounts':     'Email Accounts',
  '/warmup':       'Email Warmup',
  '/webhooks':     'Webhooks',
  '/crm':          'CRM',
  '/integrations': 'Integrations',
  '/users':        'User Management',
  '/unsubscribes': 'Unsubscribes',
}

export function DashboardLayout() {
  const { pathname } = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const title = PAGE_TITLES[pathname] || 'Sendio'

  return (
    <div className="flex h-screen overflow-hidden bg-page">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col" style={{ width: 220, flexShrink: 0 }}>
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0" style={{ width: 220 }}>
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-4 px-6 py-3 flex-shrink-0 bg-white" style={{ borderBottom: '1px solid #e2e8f0', height: 56 }}>
          <button className="md:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-100" onClick={() => setMobileOpen(true)}>
            <Menu size={20} />
          </button>
          <h1 className="text-base font-semibold text-gray-900">{title}</h1>
        </header>
        <main className="flex-1 overflow-y-auto bg-page">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
