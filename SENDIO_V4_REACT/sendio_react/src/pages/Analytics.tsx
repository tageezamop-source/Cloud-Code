import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { Mail, TrendingUp, MousePointer, MessageCircle, AlertTriangle, ThumbsUp, UserMinus, Play } from 'lucide-react'

interface Stats {
  sent: number
  opens: number
  clicks: number
  replies: number
  bounce_rate: number
  positive_replies: number
  unsubscribes: number
  active_campaigns: number
}

interface DailyData {
  date: string
  sent: number
  replies: number
  opens: number
}

interface ESPData {
  name: string
  value: number
}

interface TopCampaign {
  id: number
  name: string
  sent: number
  replied: number
  reply_rate: number
  status: string
}

const STAT_CARDS = [
  { key: 'sent', label: 'Emails Sent', icon: Mail, color: '#6366f1', fmt: (v: number) => v.toLocaleString() },
  { key: 'opens', label: 'Opens', icon: TrendingUp, color: '#22c55e', fmt: (v: number) => v.toLocaleString() },
  { key: 'clicks', label: 'Clicks', icon: MousePointer, color: '#3b82f6', fmt: (v: number) => v.toLocaleString() },
  { key: 'replies', label: 'Replies', icon: MessageCircle, color: '#a855f7', fmt: (v: number) => v.toLocaleString() },
  { key: 'bounce_rate', label: 'Bounce Rate', icon: AlertTriangle, color: '#ef4444', fmt: (v: number) => v + '%' },
  { key: 'positive_replies', label: 'Positive Replies', icon: ThumbsUp, color: '#f59e0b', fmt: (v: number) => v.toLocaleString() },
  { key: 'unsubscribes', label: 'Unsubscribes', icon: UserMinus, color: '#64748b', fmt: (v: number) => v.toLocaleString() },
  { key: 'active_campaigns', label: 'Active Campaigns', icon: Play, color: '#06b6d4', fmt: (v: number) => v.toLocaleString() },
]

const ESP_COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#ec4899']

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="px-4 py-3 rounded-xl text-sm" style={{ background: '#131f35', border: '1px solid rgba(99,102,241,0.3)' }}>
      <p className="text-slate-400 mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

export default function Analytics() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [daily, setDaily] = useState<DailyData[]>([])
  const [esp, setEsp] = useState<ESPData[]>([])
  const [topCamps, setTopCamps] = useState<TopCampaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/analytics/global').then((d: { stats: Stats; daily: DailyData[]; esp: ESPData[]; top_campaigns: TopCampaign[] }) => {
      setStats(d.stats)
      setDaily(d.daily)
      setEsp(d.esp)
      setTopCamps(d.top_campaigns)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-500">Loading analytics...</div>

  return (
    <div className="p-6 space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ key, label, icon: Icon, color, fmt }) => (
          <div key={key} className="p-5 rounded-2xl" style={{ background: '#0d1829', border: '1px solid rgba(99,102,241,0.15)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-400">{label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: color + '20' }}>
                <Icon size={16} style={{ color }} />
              </div>
            </div>
            <div className="text-2xl font-bold text-white">
              {stats ? fmt(stats[key as keyof Stats] as number) : '—'}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Daily line chart */}
        <div className="md:col-span-2 p-5 rounded-2xl" style={{ background: '#0d1829', border: '1px solid rgba(99,102,241,0.15)' }}>
          <h3 className="text-sm font-semibold text-white mb-5">Activity (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={daily} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
              <XAxis dataKey="date" tick={{ fill: '#4a5578', fontSize: 11 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fill: '#4a5578', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="sent" stroke="#6366f1" strokeWidth={2} dot={false} name="Sent" />
              <Line type="monotone" dataKey="opens" stroke="#22c55e" strokeWidth={2} dot={false} name="Opens" />
              <Line type="monotone" dataKey="replies" stroke="#a855f7" strokeWidth={2} dot={false} name="Replies" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-6 mt-2 justify-center">
            {[['Sent', '#6366f1'], ['Opens', '#22c55e'], ['Replies', '#a855f7']].map(([n, c]) => (
              <div key={n} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                <span className="text-xs text-slate-400">{n}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ESP Pie */}
        <div className="p-5 rounded-2xl" style={{ background: '#0d1829', border: '1px solid rgba(99,102,241,0.15)' }}>
          <h3 className="text-sm font-semibold text-white mb-5">ESP Breakdown</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={esp} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value">
                {esp.map((_, i) => <Cell key={i} fill={ESP_COLORS[i % ESP_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {esp.map((e, i) => (
              <div key={e.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: ESP_COLORS[i % ESP_COLORS.length] }} />
                  <span className="text-xs text-slate-400">{e.name}</span>
                </div>
                <span className="text-xs font-semibold text-slate-300">{e.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Campaigns */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#0d1829', border: '1px solid rgba(99,102,241,0.15)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
          <h3 className="text-sm font-semibold text-white">Top Campaigns</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.08)' }}>
              {['Campaign', 'Status', 'Sent', 'Replied', 'Reply Rate'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topCamps.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500">No campaign data yet</td></tr>
            )}
            {topCamps.map(c => (
              <tr key={c.id} className="hover:bg-white/2" style={{ borderBottom: '1px solid rgba(99,102,241,0.06)' }}>
                <td className="px-5 py-3 text-sm text-white font-medium">{c.name}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${
                    c.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                  }`}>{c.status}</span>
                </td>
                <td className="px-5 py-3 text-sm text-slate-300">{c.sent}</td>
                <td className="px-5 py-3 text-sm text-green-400">{c.replied}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(99,102,241,0.15)', maxWidth: 80 }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(c.reply_rate, 100)}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
                    </div>
                    <span className="text-sm font-semibold text-slate-300">{c.reply_rate}%</span>
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
