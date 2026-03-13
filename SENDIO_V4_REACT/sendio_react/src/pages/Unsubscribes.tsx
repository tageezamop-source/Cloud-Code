import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { Search, Download, Ban } from 'lucide-react'

interface Unsub {
  id: number
  email: string
  campaign_id: number | null
  reason: string
  created_at: string
}

export default function Unsubscribes() {
  const [unsubs, setUnsubs] = useState<Unsub[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = (q = '') => {
    api.get(`/unsubscribes${q ? `?q=${encodeURIComponent(q)}` : ''}`).then((d: Unsub[]) => {
      setUnsubs(d)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    load(search)
  }

  const exportCSV = () => {
    const rows = [['ID', 'Email', 'Campaign ID', 'Reason', 'Date']]
    unsubs.forEach(u => rows.push([String(u.id), u.email, String(u.campaign_id || ''), u.reason || '', new Date(u.created_at).toLocaleString()]))
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'unsubscribes.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by email..."
              className="pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: '#0d1829', border: '1px solid rgba(99,102,241,0.2)', color: '#f0f4ff', width: 280 }}
            />
          </div>
          <button type="submit" className="px-4 py-2.5 rounded-xl text-sm font-medium text-white hover:opacity-90" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            Search
          </button>
        </form>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-slate-400">{unsubs.length.toLocaleString()} total unsubscribes</span>
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-all" style={{ background: '#0d1829', border: '1px solid rgba(99,102,241,0.2)' }}>
            <Download size={15} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: '#0d1829', border: '1px solid rgba(99,102,241,0.15)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
              {['Email', 'Campaign ID', 'Reason', 'Date'].map(h => (
                <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={4} className="px-5 py-12 text-center text-slate-500">Loading...</td></tr>}
            {!loading && unsubs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-16 text-center">
                  <Ban size={40} className="mx-auto mb-3 text-slate-700" />
                  <p className="text-slate-500">No unsubscribes yet</p>
                </td>
              </tr>
            )}
            {unsubs.map(u => (
              <tr key={u.id} className="hover:bg-white/2 transition-colors" style={{ borderBottom: '1px solid rgba(99,102,241,0.06)' }}>
                <td className="px-5 py-4 text-sm text-white font-medium">{u.email}</td>
                <td className="px-5 py-4 text-sm text-slate-400">{u.campaign_id || '—'}</td>
                <td className="px-5 py-4 text-sm text-slate-400">{u.reason || 'user_request'}</td>
                <td className="px-5 py-4 text-sm text-slate-400">{new Date(u.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
