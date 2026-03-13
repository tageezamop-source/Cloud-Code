import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { Plus, Play, Pause, Trash2, Edit, Search, BarChart2, Mail } from 'lucide-react'

interface Campaign {
  id: number
  name: string
  status: string
  total_rows: number
  step_count: number
  stats: { total: number; sent: number; replied: number; bounced: number }
  created_at: string
}

const STATUS_STYLE: Record<string, string> = {
  active:    'bg-green-100 text-green-700',
  paused:    'bg-amber-100 text-amber-700',
  draft:     'bg-gray-100 text-gray-500',
  completed: 'bg-blue-100 text-blue-700',
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const load = () => {
    api.get('/get-campaigns').then((d: Campaign[]) => { setCampaigns(d); setLoading(false) }).catch(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const createNew = async () => {
    const camp = await api.post('/get-campaigns', { name: 'New Campaign' }) as { id: number }
    navigate(`/campaign/${camp.id}/wizard`)
  }

  const toggleStatus = async (c: Campaign) => {
    if (c.status === 'active') await api.post(`/campaign/${c.id}/pause`, {})
    else await api.post(`/campaign/${c.id}/start`, {})
    load()
  }

  const deleteCampaign = async (id: number) => {
    if (!confirm('Delete this campaign and all its data?')) return
    await api.delete(`/delete-campaign/${id}`)
    load()
  }

  const filtered = campaigns.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search campaigns..."
            className="pl-9 pr-4 py-2 rounded-xl text-sm border border-gray-200 bg-white text-gray-800 outline-none focus:border-primary"
            style={{ width: 260 }} />
        </div>
        <button onClick={createNew}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-dark transition-all shadow-pop">
          <Plus size={16} /> New Campaign
        </button>
      </div>

      {/* Stats row */}
      {campaigns.length > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Campaigns', value: campaigns.length, icon: <Mail size={16} className="text-primary" /> },
            { label: 'Active', value: campaigns.filter(c => c.status === 'active').length, icon: <Play size={16} className="text-green-500" /> },
            { label: 'Total Leads', value: campaigns.reduce((a, c) => a + c.total_rows, 0).toLocaleString(), icon: <BarChart2 size={16} className="text-blue-500" /> },
            { label: 'Total Replies', value: campaigns.reduce((a, c) => a + (c.stats?.replied || 0), 0), icon: <Mail size={16} className="text-purple-500" /> },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-white rounded-xl p-4 shadow-card flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center">{icon}</div>
              <div>
                <p className="text-xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-muted">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              {['Campaign', 'Status', 'Leads', 'Sent', 'Replies', 'Steps', 'Created', 'Actions'].map(h => (
                <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={8} className="px-5 py-16 text-center text-muted">Loading...</td></tr>}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={8} className="px-5 py-20 text-center">
                <Mail size={40} className="mx-auto mb-4 text-gray-200" />
                <p className="text-gray-400 font-medium mb-2">No campaigns yet</p>
                <p className="text-sm text-muted mb-5">Create your first campaign to start reaching out to prospects.</p>
                <button onClick={createNew} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-dark transition-all">
                  Create Campaign
                </button>
              </td></tr>
            )}
            {filtered.map(c => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: '1px solid #f8fafc' }}>
                <td className="px-5 py-4">
                  <button onClick={() => navigate(`/campaign/${c.id}/wizard`)}
                    className="font-semibold text-gray-900 hover:text-primary transition-colors text-left text-sm">
                    {c.name}
                  </button>
                  <p className="text-xs text-muted mt-0.5">{new Date(c.created_at).toLocaleDateString()}</p>
                </td>
                <td className="px-5 py-4">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLE[c.status] || STATUS_STYLE.draft}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-gray-700">{c.total_rows.toLocaleString()}</td>
                <td className="px-5 py-4 text-sm text-gray-700">{c.stats?.sent || 0}</td>
                <td className="px-5 py-4 text-sm font-medium text-green-600">{c.stats?.replied || 0}</td>
                <td className="px-5 py-4 text-sm text-gray-700">{c.step_count || 0}</td>
                <td className="px-5 py-4 text-sm text-muted">{new Date(c.created_at).toLocaleDateString()}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1">
                    <button onClick={() => navigate(`/campaign/${c.id}/wizard`)} title="Edit"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary-light transition-all">
                      <Edit size={15} />
                    </button>
                    <button onClick={() => toggleStatus(c)} title={c.status === 'active' ? 'Pause' : 'Start'}
                      className={`p-1.5 rounded-lg transition-all ${c.status === 'active' ? 'text-amber-500 hover:bg-amber-50' : 'text-green-500 hover:bg-green-50'}`}>
                      {c.status === 'active' ? <Pause size={15} /> : <Play size={15} />}
                    </button>
                    <button onClick={() => deleteCampaign(c.id)} title="Delete"
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
