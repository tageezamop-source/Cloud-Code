import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { Plus, Trash2, Play, X, ExternalLink, Check, AlertCircle } from 'lucide-react'

interface Webhook {
  id: number
  name: string
  url: string
  events: string[]
  active: boolean
  fire_count: number
  fail_count: number
  created_at: string
}

interface WebhookLog {
  id: number
  event: string
  payload: string
  status_code: number
  success: boolean
  created_at: string
}

const EVENT_TYPES = [
  'reply.received',
  'reply.positive',
  'email.bounced',
  'campaign.started',
  'lead.unsubscribed',
]

const INTEGRATIONS = [
  { name: 'Zapier', desc: 'Automate with 5000+ apps', color: '#ff4a00', icon: '⚡' },
  { name: 'Make', desc: 'Visual workflow automation', color: '#6d00cc', icon: '🔮' },
  { name: 'Slack', desc: 'Get notified in Slack', color: '#4a154b', icon: '💬' },
  { name: 'HubSpot', desc: 'Sync leads to HubSpot CRM', color: '#ff7a59', icon: '🔶' },
  { name: 'Salesforce', desc: 'Push data to Salesforce', color: '#00a1e0', icon: '☁️' },
  { name: 'Pipedrive', desc: 'Update Pipedrive deals', color: '#26292c', icon: '🔧' },
]

export default function Webhooks() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showLogs, setShowLogs] = useState<number | null>(null)
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [testing, setTesting] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', url: '', secret: '', events: [] as string[] })

  const load = () => {
    api.get('/webhooks').then((d: Webhook[]) => { setWebhooks(d); setLoading(false) }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openLogs = async (id: number) => {
    setShowLogs(id)
    const l = await api.get(`/webhooks/${id}/logs`) as WebhookLog[]
    setLogs(l)
  }

  const testHook = async (id: number) => {
    setTesting(id)
    try {
      await api.post(`/webhooks/${id}/test`, {})
      alert('Test event fired!')
    } catch (err: unknown) {
      alert('Test failed: ' + (err instanceof Error ? err.message : 'Error'))
    } finally {
      setTesting(null)
    }
  }

  const deleteHook = async (id: number) => {
    if (!confirm('Delete this webhook?')) return
    await api.delete(`/webhooks/${id}`)
    load()
  }

  const toggleEvent = (ev: string) => {
    setForm(f => ({
      ...f,
      events: f.events.includes(ev) ? f.events.filter(e => e !== ev) : [...f.events, ev]
    }))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.events.length) { alert('Select at least one event'); return }
    await api.post('/webhooks', form)
    setShowAdd(false)
    setForm({ name: '', url: '', secret: '', events: [] })
    load()
  }

  return (
    <div className="p-6 space-y-6">
      {/* Integration cards */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Popular Integrations</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {INTEGRATIONS.map(({ name, desc, color, icon }) => (
            <div key={name} className="p-4 rounded-xl text-center cursor-pointer hover:scale-105 transition-all" style={{ background: '#0d1829', border: '1px solid rgba(99,102,241,0.15)' }}>
              <div className="text-2xl mb-2">{icon}</div>
              <p className="text-sm font-semibold text-white">{name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Webhooks list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Custom Webhooks</h2>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <Plus size={16} />
            Add Webhook
          </button>
        </div>

        {loading && <div className="text-center py-8 text-slate-500">Loading...</div>}

        <div className="space-y-3">
          {webhooks.map(h => (
            <div key={h.id} className="p-5 rounded-2xl" style={{ background: '#0d1829', border: '1px solid rgba(99,102,241,0.15)' }}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-white">{h.name}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${h.active ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}`}>
                      {h.active ? 'active' : 'inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 truncate mb-2">{h.url}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {h.events.map(ev => (
                      <span key={ev} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>{ev}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="text-green-400">✓ {h.fire_count} fired</span>
                    <span className="text-red-400">✗ {h.fail_count} failed</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button onClick={() => openLogs(h.id)} className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition-all" style={{ border: '1px solid rgba(99,102,241,0.15)' }}>
                    Logs
                  </button>
                  <button onClick={() => testHook(h.id)} disabled={testing === h.id} className="px-3 py-1.5 rounded-lg text-xs text-indigo-400 hover:text-indigo-300 transition-all" style={{ border: '1px solid rgba(99,102,241,0.3)' }}>
                    {testing === h.id ? 'Testing...' : 'Test'}
                  </button>
                  <button onClick={() => deleteHook(h.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!loading && webhooks.length === 0 && (
            <div className="text-center py-8 text-slate-500">No webhooks configured yet</div>
          )}
        </div>
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-lg rounded-2xl" style={{ background: '#0d1829', border: '1px solid rgba(99,102,241,0.2)' }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
              <h2 className="text-lg font-semibold text-white">Add Webhook</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={submit} className="p-6 space-y-4">
              <div>
                <label className="text-sm text-slate-300 mb-1.5 block">Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="My Zapier Webhook" required
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: '#131f35', border: '1px solid rgba(99,102,241,0.2)', color: '#f0f4ff' }} />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1.5 block">Endpoint URL</label>
                <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://hooks.zapier.com/..." required type="url"
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: '#131f35', border: '1px solid rgba(99,102,241,0.2)', color: '#f0f4ff' }} />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1.5 block">Secret (optional, for HMAC verification)</label>
                <input value={form.secret} onChange={e => setForm(f => ({ ...f, secret: e.target.value }))} placeholder="my-secret-key"
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: '#131f35', border: '1px solid rgba(99,102,241,0.2)', color: '#f0f4ff' }} />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-2 block">Events to subscribe to</label>
                <div className="space-y-2">
                  {EVENT_TYPES.map(ev => (
                    <label key={ev} className="flex items-center gap-3 cursor-pointer group">
                      <div
                        onClick={() => toggleEvent(ev)}
                        className={`w-4 h-4 rounded flex items-center justify-center transition-all ${form.events.includes(ev) ? 'bg-indigo-600' : 'border border-slate-600 hover:border-indigo-400'}`}
                      >
                        {form.events.includes(ev) && <Check size={11} className="text-white" />}
                      </div>
                      <span className="text-sm text-slate-300 font-mono">{ev}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full py-3 rounded-xl font-semibold text-white text-sm hover:opacity-90" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                Create Webhook
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Logs modal */}
      {showLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-2xl max-h-[80vh] flex flex-col rounded-2xl" style={{ background: '#0d1829', border: '1px solid rgba(99,102,241,0.2)' }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
              <h2 className="text-lg font-semibold text-white">Webhook Delivery Logs</h2>
              <button onClick={() => setShowLogs(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {logs.length === 0 && <div className="text-center py-8 text-slate-500">No deliveries yet</div>}
              {logs.map(log => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#131f35' }}>
                  {log.success
                    ? <Check size={15} className="text-green-400 flex-shrink-0 mt-0.5" />
                    : <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-sm font-mono text-slate-300">{log.event}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${log.success ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
                        {log.status_code || 'error'}
                      </span>
                      <span className="text-xs text-slate-500">{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate font-mono">{log.payload?.slice(0, 120)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
