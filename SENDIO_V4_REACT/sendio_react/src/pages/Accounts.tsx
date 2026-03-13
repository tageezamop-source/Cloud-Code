import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { Plus, Trash2, Check, X, Server, Shield } from 'lucide-react'

interface Account {
  id: number
  name: string
  email: string
  provider: string
  smtp_host: string
  smtp_port: number
  smtp_user: string
  imap_host: string
  imap_port: number
  esp_type: string
  gap_minutes: number
  verified: boolean
  created_at: string
}

const ESP_BADGE: Record<string, { label: string; color: string }> = {
  google: { label: 'Google', color: '#4285F4' },
  microsoft: { label: 'Microsoft', color: '#00a4ef' },
  ses: { label: 'SES', color: '#f59e0b' },
  sendgrid: { label: 'SendGrid', color: '#22c55e' },
  other: { label: 'SMTP', color: '#6366f1' },
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl" style={{ background: '#0d1829', border: '1px solid rgba(99,102,241,0.2)' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  )
}

const inputCls = "w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
const inputStyle = { background: '#131f35', border: '1px solid rgba(99,102,241,0.2)', color: '#f0f4ff' }

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState<number | null>(null)
  const [form, setForm] = useState({
    name: '', email: '', smtp_host: '', smtp_port: '587', smtp_user: '', smtp_pass: '',
    imap_host: '', imap_port: '993', imap_user: '', imap_pass: '', gap_minutes: '3',
  })

  const load = () => {
    api.get('/accounts').then((d: Account[]) => { setAccounts(d); setLoading(false) }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.post('/accounts', {
      ...form,
      smtp_port: parseInt(form.smtp_port),
      imap_port: parseInt(form.imap_port),
      gap_minutes: parseInt(form.gap_minutes),
    })
    setShowAdd(false)
    setForm({ name: '', email: '', smtp_host: '', smtp_port: '587', smtp_user: '', smtp_pass: '', imap_host: '', imap_port: '993', imap_user: '', imap_pass: '', gap_minutes: '3' })
    load()
  }

  const deleteAccount = async (id: number) => {
    if (!confirm('Remove this account?')) return
    await api.delete(`/accounts/${id}`)
    load()
  }

  const verify = async (id: number) => {
    setVerifying(id)
    try {
      await api.post(`/verify-account/${id}`, {})
      load()
      alert('Account verified successfully!')
    } catch (err: unknown) {
      alert('Verification failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setVerifying(null)
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <p className="text-slate-400 text-sm">{accounts.length} account{accounts.length !== 1 ? 's' : ''} connected</p>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-all" style={{ background: '#0d1829', border: '1px solid rgba(99,102,241,0.2)' }}>
            <svg width="16" height="16" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/></svg>
            Connect Google
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-all" style={{ background: '#0d1829', border: '1px solid rgba(99,102,241,0.2)' }}>
            <svg width="16" height="16" viewBox="0 0 21 21"><path fill="#f25022" d="M1 1h9v9H1z"/><path fill="#00a4ef" d="M11 1h9v9h-9z"/><path fill="#7fba00" d="M1 11h9v9H1z"/><path fill="#ffb900" d="M11 11h9v9h-9z"/></svg>
            Connect Outlook
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <Plus size={16} />
            Add SMTP
          </button>
        </div>
      </div>

      {loading && <div className="text-center py-12 text-slate-500">Loading accounts...</div>}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(acc => {
          const esp = ESP_BADGE[acc.esp_type] || ESP_BADGE.other
          return (
            <div key={acc.id} className="p-5 rounded-2xl" style={{ background: '#0d1829', border: '1px solid rgba(99,102,241,0.15)' }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: esp.color + '20' }}>
                  <Server size={20} style={{ color: esp.color }} />
                </div>
                <div className="flex gap-1">
                  {acc.verified && (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-400 px-2 py-1 rounded-lg" style={{ background: 'rgba(34,197,94,0.1)' }}>
                      <Check size={12} /> Verified
                    </span>
                  )}
                  <button onClick={() => deleteAccount(acc.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-white mb-1 truncate">{acc.name || acc.email}</h3>
              <p className="text-sm text-slate-400 mb-3 truncate">{acc.email}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: esp.color + '20', color: esp.color }}>
                  {esp.label}
                </span>
                <button
                  onClick={() => verify(acc.id)}
                  disabled={verifying === acc.id}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-indigo-400 transition-colors"
                >
                  <Shield size={13} />
                  {verifying === acc.id ? 'Testing...' : 'Test connection'}
                </button>
              </div>
              <div className="mt-3 pt-3 text-xs text-slate-500" style={{ borderTop: '1px solid rgba(99,102,241,0.1)' }}>
                {acc.smtp_host}:{acc.smtp_port} · {acc.gap_minutes}min gap
              </div>
            </div>
          )
        })}
      </div>

      {!loading && accounts.length === 0 && (
        <div className="text-center py-20">
          <Server size={48} className="mx-auto mb-4 text-slate-700" />
          <h3 className="text-lg font-semibold text-slate-400 mb-2">No email accounts connected</h3>
          <p className="text-sm text-slate-500 mb-6">Connect your first email account to start sending campaigns.</p>
          <button onClick={() => setShowAdd(true)} className="px-6 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            Add SMTP Account
          </button>
        </div>
      )}

      {showAdd && (
        <Modal title="Add SMTP Account" onClose={() => setShowAdd(false)}>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Display Name</label>
                <input className={inputCls} style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="My Mailbox" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Email Address *</label>
                <input className={inputCls} style={inputStyle} value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@company.com" required />
              </div>
            </div>

            <div className="pt-2" style={{ borderTop: '1px solid rgba(99,102,241,0.1)' }}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">SMTP Settings</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-slate-400 mb-1.5 block">SMTP Host *</label>
                  <input className={inputCls} style={inputStyle} value={form.smtp_host} onChange={e => set('smtp_host', e.target.value)} placeholder="smtp.gmail.com" required />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Port</label>
                  <input className={inputCls} style={inputStyle} value={form.smtp_port} onChange={e => set('smtp_port', e.target.value)} type="number" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">SMTP Username *</label>
                  <input className={inputCls} style={inputStyle} value={form.smtp_user} onChange={e => set('smtp_user', e.target.value)} required />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">SMTP Password *</label>
                  <input className={inputCls} style={inputStyle} value={form.smtp_pass} onChange={e => set('smtp_pass', e.target.value)} type="password" required />
                </div>
              </div>
            </div>

            <div className="pt-2" style={{ borderTop: '1px solid rgba(99,102,241,0.1)' }}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">IMAP Settings (for inbox)</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-slate-400 mb-1.5 block">IMAP Host</label>
                  <input className={inputCls} style={inputStyle} value={form.imap_host} onChange={e => set('imap_host', e.target.value)} placeholder="imap.gmail.com" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Port</label>
                  <input className={inputCls} style={inputStyle} value={form.imap_port} onChange={e => set('imap_port', e.target.value)} type="number" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">IMAP Username</label>
                  <input className={inputCls} style={inputStyle} value={form.imap_user} onChange={e => set('imap_user', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">IMAP Password</label>
                  <input className={inputCls} style={inputStyle} value={form.imap_pass} onChange={e => set('imap_pass', e.target.value)} type="password" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Gap between emails (minutes)</label>
              <input className={inputCls} style={inputStyle} value={form.gap_minutes} onChange={e => set('gap_minutes', e.target.value)} type="number" min="1" />
            </div>

            <button type="submit" className="w-full py-3 rounded-xl font-semibold text-white text-sm hover:opacity-90 transition-all" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              Add Account
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}
