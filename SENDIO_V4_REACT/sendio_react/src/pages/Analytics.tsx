import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Mail, TrendingUp, MousePointer, MessageCircle, AlertTriangle, ThumbsUp, UserMinus, Play } from 'lucide-react'

interface Stats { sent: number; opens: number; clicks: number; replies: number; bounce_rate: number; positive_replies: number; unsubscribes: number; active_campaigns: number }
interface DailyData { date: string; sent: number; replies: number; opens: number }
interface ESPData { name: string; value: number }
interface TopCampaign { id: number; name: string; sent: number; replied: number; reply_rate: number; status: string }

const STAT_CARDS = [
  { key: 'sent', label: 'Emails Sent', icon: Mail, color: '#6366f1', bg: '#ede9fe', fmt: (v: number) => v.toLocaleString() },
  { key: 'opens', label: 'Opens', icon: TrendingUp, color: '#22c55e', bg: '#dcfce7', fmt: (v: number) => v.toLocaleString() },
  { key: 'clicks', label: 'Clicks', icon: MousePointer, color: '#3b82f6', bg: '#dbeafe', fmt: (v: number) => v.toLocaleString() },
  { key: 'replies', label: 'Replies', icon: MessageCircle, color: '#a855f7', bg: '#f3e8ff', fmt: (v: number) => v.toLocaleString() },
  { key: 'bounce_rate', label: 'Bounce Rate', icon: AlertTriangle, color: '#ef4444', bg: '#fee2e2', fmt: (v: number) => v + '%' },
  { key: 'positive_replies', label: 'Positive Replies', icon: ThumbsUp, color: '#f59e0b', bg: '#fef3c7', fmt: (v: number) => v.toLocaleString() },
  { key: 'unsubscribes', label: 'Unsubscribes', icon: UserMinus, color: '#64748b', bg: '#f1f5f9', fmt: (v: number) => v.toLocaleString() },
  { key: 'active_campaigns', label: 'Active Campaigns', icon: Play, color: '#06b6d4', bg: '#cffafe', fmt: (v: number) => v.toLocaleString() },
]
const ESP_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899']
const STATUS_STYLE: Record<string, string> = { active: 'bg-green-100 text-green-700', draft: 'bg-gray-100 text-gray-500', paused: 'bg-amber-100 text-amber-700' }

export default function Analytics() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [daily, setDaily] = useState<DailyData[]>([])
  const [esp, setEsp] = useState<ESPData[]>([])
  const [topCamps, setTopCamps] = useState<TopCampaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/analytics/global').then((d: { stats: Stats; daily: DailyData[]; esp: ESPData[]; top_campaigns: TopCampaign[] }) => {
      setStats(d.stats); setDaily(d.daily); setEsp(d.esp); setTopCamps(d.top_campaigns); setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64 text-muted">Loading analytics...</div>

  return (
    <div className="p-6 space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ key, label, icon: Icon, color, bg, fmt }) => (
          <div key={key} className="bg-white rounded-2xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted">{label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                <Icon size={16} style={{ color }} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats ? fmt(stats[key as keyof Stats] as number) : '—'}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white rounded-2xl p-5 shadow-card">
          <h3 className="text-sm font-semibold text-gray-700 mb-5">Activity (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={daily} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="sent" stroke="#6366f1" strokeWidth={2} dot={false} name="Sent" />
              <Line type="monotone" dataKey="opens" stroke="#22c55e" strokeWidth={2} dot={false} name="Opens" />
              <Line type="monotone" dataKey="replies" stroke="#a855f7" strokeWidth={2} dot={false} name="Replies" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-6 mt-2 justify-center">
            {[['Sent', '#6366f1'], ['Opens', '#22c55e'], ['Replies', '#a855f7']].map(([n, c]) => (
              <div key={n} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                <span className="text-xs text-muted">{n}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <h3 className="text-sm font-semibold text-gray-700 mb-5">ESP Breakdown</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart><Pie data={esp} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value">
              {esp.map((_, i) => <Cell key={i} fill={ESP_COLORS[i % ESP_COLORS.length]} />)}
            </Pie><Tooltip /></PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {esp.map((e, i) => (
              <div key={e.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: ESP_COLORS[i % ESP_COLORS.length] }} />
                  <span className="text-xs text-muted">{e.name}</span>
                </div>
                <span className="text-xs font-semibold text-gray-700">{e.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-700">Top Campaigns</h3></div>
        <table className="w-full">
          <thead><tr className="border-b border-gray-50">
            {['Campaign', 'Status', 'Sent', 'Replied', 'Reply Rate'].map(h => (
              <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {topCamps.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-muted text-sm">No data yet</td></tr>}
            {topCamps.map(c => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: '1px solid #f8fafc' }}>
                <td className="px-5 py-3.5 text-sm font-medium text-gray-800">{c.name}</td>
                <td className="px-5 py-3.5"><span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${STATUS_STYLE[c.status] || STATUS_STYLE.draft}`}>{c.status}</span></td>
                <td className="px-5 py-3.5 text-sm text-gray-700">{c.sent}</td>
                <td className="px-5 py-3.5 text-sm font-medium text-green-600">{c.replied}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden" style={{ maxWidth: 80 }}>
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(c.reply_rate, 100)}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{c.reply_rate}%</span>
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
