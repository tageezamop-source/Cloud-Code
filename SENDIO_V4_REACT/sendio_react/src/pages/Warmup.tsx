import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { Plus, Play, Pause, Trash2, X, Thermometer } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface WarmupAccount {
  id: number
  account_id: number
  account_email: string
  account_name: string
  status: string
  daily_target: number
  daily_current: number
  ramp_days: number
  score: number
  logs: WarmupLog[]
}

interface WarmupLog {
  date: string
  sent: number
  received: number
  replied: number
  score_delta: number
}

interface EmailAccount {
  id: number
  email: string
  name: string
}

function ScoreRing({ score }: { score: number }) {
  const r = 40
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(99,102,241,0.1)" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-bold text-white">{score}</div>
        <div className="text-xs text-slate-500">score</div>
      </div>
    </div>
  )
}

export default function Warmup() {
  const [warmups, setWarmups] = useState<WarmupAccount[]>([])
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [running, setRunning] = useState<number | null>(null)
  const [form, setForm] = useState({ account_id: '', daily_target: '40', ramp_days: '30' })

  const load = () => {
    Promise.all([api.get('/warmup'), api.get('/accounts')]).then(([w, a]) => {
      setWarmups(w as WarmupAccount[])
      setAccounts(a as EmailAccount[])
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const addWarmup = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.post('/warmup', {
      account_id: parseInt(form.account_id),
      daily_target: parseInt(form.daily_target),
      ramp_days: parseInt(form.ramp_days),
    })
    setShowAdd(false)
    load()
  }

  const toggleStatus = async (w: WarmupAccount) => {
    const newStatus = w.status === 'running' ? 'paused' : 'running'
    await api.put(`/warmup/${w.id}`, { status: newStatus })
    load()
  }

  const runNow = async (id: number) => {
    setRunning(id)
    try {
      await api.post(`/warmup/${id}/run`, {})
      load()
    } finally {
      setRunning(null)
    }
  }

  const deleteWarmup = async (id: number) => {
    if (!confirm('Remove this warmup account?')) return
    await api.delete(`/warmup/${id}`)
    load()
  }

  const STATUS_COLORS: Record<string, string> = {
    running: 'text-green-400 bg-green-500/10 border-green-500/20',
    paused: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    completed: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <p className="text-slate-400 text-sm">{warmups.length} account{warmups.length !== 1 ? 's' : ''} warming up</p>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        >
          <Plus size={16} />
          Add Account
        </button>
      </div>

      {loading && <div className="text-center py-12 text-slate-500">Loading...</div>}

      {!loading && warmups.length === 0 && (
        <div className="text-center py-20">
          <Thermometer size={48} className="mx-auto mb-4 text-slate-700" />
          <h3 className="text-lg font-semibold text-slate-400 mb-2">No warmup accounts</h3>
          <p className="text-sm text-slate-500 mb-6">Start warming up your email accounts to improve deliverability.</p>
          <button onClick={() => setShowAdd(true)} className="px-6 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            Add Warmup Account
          </button>
        </div>
      )}

      <div className="space-y-4">
        {warmups.map(w => (
          <div key={w.id} className="p-6 rounded-2xl" style={{ background: '#0d1829', border: '1px solid rgba(99,102,241,0.15)' }}>
            <div className="flex items-start gap-6">
              <ScoreRing score={w.score} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-white">{w.account_name || w.account_email}</h3>
                    <p className="text-sm text-slate-400">{w.account_email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLORS[w.status] || STATUS_COLORS.paused}`}>
                      {w.status}
                    </span>
                    <button onClick={() => toggleStatus(w)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                      {w.status === 'running' ? <Pause size={15} /> : <Play size={15} />}
                    </button>
                    <button onClick={() => runNow(w.id)} disabled={running === w.id} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all text-xs font-medium">
                      {running === w.id ? '...' : 'Run'}
                    </button>
                    <button onClick={() => deleteWarmup(w.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                    <span>Ramp progress</span>
                    <span>{Math.min(w.score, w.ramp_days)} / {w.ramp_days} days</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(99,102,241,0.15)' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min((w.score / 100) * 100, 100)}%`, background: 'linear-gradient(90deg, #6366f1, #22c55e)' }} />
                  </div>
                </div>

                <div className="flex gap-6 text-sm mb-4">
                  <div>
                    <span className="text-slate-500">Today: </span>
                    <span className="text-slate-200 font-medium">{w.daily_current}</span>
                    <span className="text-slate-500"> / {w.daily_target}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Target: </span>
                    <span className="text-slate-200 font-medium">{w.daily_target} emails/day</span>
                  </div>
                </div>

                {/* Activity chart */}
                {w.logs.length > 0 && (
                  <ResponsiveContainer width="100%" height={80}>
                    <LineChart data={w.logs} margin={{ top: 0, right: 0, bottom: 0, left: -30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.06)" />
                      <XAxis dataKey="date" tick={false} />
                      <YAxis tick={{ fill: '#4a5578', fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ background: '#131f35', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, fontSize: 12 }}
                        labelStyle={{ color: '#8b9ab5' }}
                      />
                      <Line type="monotone" dataKey="sent" stroke="#6366f1" strokeWidth={2} dot={false} name="Sent" />
                      <Line type="monotone" dataKey="replied" stroke="#22c55e" strokeWidth={2} dot={false} name="Replied" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-md rounded-2xl" style={{ background: '#0d1829', border: '1px solid rgba(99,102,241,0.2)' }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
              <h2 className="text-lg font-semibold text-white">Add Warmup Account</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={addWarmup} className="p-6 space-y-4">
              <div>
                <label className="text-sm text-slate-300 mb-1.5 block">Email Account</label>
                <select
                  value={form.account_id}
                  onChange={e => setForm(f => ({ ...f, account_id: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: '#131f35', border: '1px solid rgba(99,102,241,0.2)', color: '#f0f4ff' }}
                  required
                >
                  <option value="">Select account...</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.email}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-300 mb-1.5 block">Daily Target</label>
                  <input
                    type="number" min="1" max="200"
                    value={form.daily_target}
                    onChange={e => setForm(f => ({ ...f, daily_target: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: '#131f35', border: '1px solid rgba(99,102,241,0.2)', color: '#f0f4ff' }}
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1.5 block">Ramp Days</label>
                  <input
                    type="number" min="7" max="90"
                    value={form.ramp_days}
                    onChange={e => setForm(f => ({ ...f, ramp_days: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: '#131f35', border: '1px solid rgba(99,102,241,0.2)', color: '#f0f4ff' }}
                  />
                </div>
              </div>
              <button type="submit" className="w-full py-3 rounded-xl font-semibold text-white text-sm hover:opacity-90" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                Start Warmup
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
