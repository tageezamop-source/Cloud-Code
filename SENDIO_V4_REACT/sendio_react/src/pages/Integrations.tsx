import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import { Check, Eye, EyeOff } from 'lucide-react'

export default function Integrations() {
  const { user } = useAuth()
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [pwMsg, setPwMsg] = useState('')
  const [notifs, setNotifs] = useState({ email_reply: true, email_bounce: true, campaign_complete: false, weekly_report: true })

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pwForm.newPw !== pwForm.confirm) { setPwMsg('Passwords do not match'); return }
    if (pwForm.newPw.length < 6) { setPwMsg('Password must be at least 6 characters'); return }
    try {
      // Use admin reset-password endpoint (self-service)
      await api.post(`/users/${user?.id}/reset-password`, { password: pwForm.newPw })
      setPwMsg('Password updated successfully!')
      setPwForm({ current: '', newPw: '', confirm: '' })
    } catch {
      setPwMsg('Failed to update password')
    }
  }

  const inputCls = "w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
  const inputStyle = { background: '#131f35', border: '1px solid rgba(99,102,241,0.2)', color: '#f0f4ff' }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      {/* Google OAuth */}
      <div className="p-6 rounded-2xl" style={{ background: '#0d1829', border: '1px solid rgba(99,102,241,0.15)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(66,133,244,0.15)' }}>
              <svg width="20" height="20" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/></svg>
            </div>
            <div>
              <h3 className="font-semibold text-white">Google Account</h3>
              <p className="text-sm text-slate-400">{user?.google_email ? `Connected: ${user.google_email}` : 'Not connected'}</p>
            </div>
          </div>
          <button
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={user?.google_email
              ? { background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }
              : { background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }
            }
          >
            {user?.google_email ? (
              <span className="flex items-center gap-1.5"><Check size={14} />Connected</span>
            ) : 'Connect'}
          </button>
        </div>
      </div>

      {/* Microsoft OAuth */}
      <div className="p-6 rounded-2xl" style={{ background: '#0d1829', border: '1px solid rgba(99,102,241,0.15)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,164,239,0.15)' }}>
              <svg width="20" height="20" viewBox="0 0 21 21"><path fill="#f25022" d="M1 1h9v9H1z"/><path fill="#00a4ef" d="M11 1h9v9h-9z"/><path fill="#7fba00" d="M1 11h9v9H1z"/><path fill="#ffb900" d="M11 11h9v9h-9z"/></svg>
            </div>
            <div>
              <h3 className="font-semibold text-white">Microsoft / Outlook</h3>
              <p className="text-sm text-slate-400">Not connected</p>
            </div>
          </div>
          <button className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }}>
            Connect
          </button>
        </div>
      </div>

      {/* Change password */}
      <div className="p-6 rounded-2xl" style={{ background: '#0d1829', border: '1px solid rgba(99,102,241,0.15)' }}>
        <h3 className="font-semibold text-white mb-4">Change Password</h3>
        <form onSubmit={changePassword} className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Current Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={pwForm.current}
                onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                className={inputCls}
                style={{ ...inputStyle, paddingRight: '40px' }}
                required
              />
              <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">New Password</label>
            <input
              type="password"
              value={pwForm.newPw}
              onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))}
              className={inputCls}
              style={inputStyle}
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Confirm New Password</label>
            <input
              type="password"
              value={pwForm.confirm}
              onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
              className={inputCls}
              style={inputStyle}
              required
            />
          </div>
          {pwMsg && (
            <p className={`text-sm ${pwMsg.includes('success') ? 'text-green-400' : 'text-red-400'}`}>{pwMsg}</p>
          )}
          <button type="submit" className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            Update Password
          </button>
        </form>
      </div>

      {/* Notification Preferences */}
      <div className="p-6 rounded-2xl" style={{ background: '#0d1829', border: '1px solid rgba(99,102,241,0.15)' }}>
        <h3 className="font-semibold text-white mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          {[
            { key: 'email_reply', label: 'New reply received', desc: 'Get notified when a prospect replies' },
            { key: 'email_bounce', label: 'Email bounced', desc: 'Alert when an email hard bounces' },
            { key: 'campaign_complete', label: 'Campaign completed', desc: 'When all sequence steps are done' },
            { key: 'weekly_report', label: 'Weekly report', desc: 'Summary of campaign performance' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-200">{label}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
              <button
                onClick={() => setNotifs(n => ({ ...n, [key]: !n[key as keyof typeof notifs] }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${notifs[key as keyof typeof notifs] ? 'bg-indigo-600' : 'bg-slate-700'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all ${notifs[key as keyof typeof notifs] ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
