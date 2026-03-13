import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { Plus, ToggleLeft, ToggleRight, Key, Trash2, X, Shield } from 'lucide-react'

interface User {
  id: number
  username: string
  role: string
  active: boolean
  email_verified: boolean
  last_login: string | null
  created_at: string
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showReset, setShowReset] = useState<number | null>(null)
  const [form, setForm] = useState({ username: '', password: '', role: 'user' })
  const [newPw, setNewPw] = useState('')

  const load = () => {
    api.get('/users').then((d: User[]) => { setUsers(d); setLoading(false) }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.post('/users/create', form)
    setShowCreate(false)
    setForm({ username: '', password: '', role: 'user' })
    load()
  }

  const toggleUser = async (id: number) => {
    await api.post(`/users/${id}/toggle`, {})
    load()
  }

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showReset || !newPw) return
    await api.post(`/users/${showReset}/reset-password`, { password: newPw })
    setShowReset(null)
    setNewPw('')
    alert('Password reset successfully')
  }

  const deleteUser = async (id: number, username: string) => {
    if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return
    try {
      await api.delete(`/users/${id}/delete`)
      load()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Cannot delete user')
    }
  }

  const inputStyle = { background: '#131f35', border: '1px solid rgba(99,102,241,0.2)', color: '#f0f4ff' }

  return (
    <div className="p-6">
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        >
          <Plus size={16} />
          Create User
        </button>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: '#0d1829', border: '1px solid rgba(99,102,241,0.15)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
              {['User', 'Role', 'Status', 'Last Login', 'Created', 'Actions'].map(h => (
                <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-500">Loading...</td></tr>}
            {users.map(u => (
              <tr key={u.id} className="hover:bg-white/2 transition-colors" style={{ borderBottom: '1px solid rgba(99,102,241,0.06)' }}>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: u.role === 'admin' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#1e293b' }}>
                      {u.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{u.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${u.role === 'admin' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${u.active ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                    {u.active ? 'active' : 'inactive'}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-slate-400">
                  {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
                </td>
                <td className="px-5 py-4 text-sm text-slate-400">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    {u.role !== 'admin' && (
                      <>
                        <button onClick={() => toggleUser(u.id)} title={u.active ? 'Deactivate' : 'Activate'} className={`p-1.5 rounded-lg transition-all ${u.active ? 'text-yellow-400 hover:bg-yellow-500/10' : 'text-green-400 hover:bg-green-500/10'}`}>
                          {u.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        </button>
                        <button onClick={() => setShowReset(u.id)} title="Reset password" className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all">
                          <Key size={15} />
                        </button>
                        <button onClick={() => deleteUser(u.id, u.username)} title="Delete user" className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                    {u.role === 'admin' && (
                      <Shield size={16} className="text-indigo-400" title="Admin — protected" />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create user modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-md rounded-2xl" style={{ background: '#0d1829', border: '1px solid rgba(99,102,241,0.2)' }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
              <h2 className="text-lg font-semibold text-white">Create User</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={createUser} className="p-6 space-y-4">
              <div>
                <label className="text-sm text-slate-300 mb-1.5 block">Username *</label>
                <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1.5 block">Password *</label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1.5 block">Role</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ ...inputStyle, appearance: 'none' }}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button type="submit" className="w-full py-3 rounded-xl font-semibold text-white text-sm hover:opacity-90" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                Create User
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Reset password modal */}
      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-sm rounded-2xl" style={{ background: '#0d1829', border: '1px solid rgba(99,102,241,0.2)' }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
              <h2 className="text-base font-semibold text-white">Reset Password</h2>
              <button onClick={() => setShowReset(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={resetPassword} className="p-6 space-y-4">
              <div>
                <label className="text-sm text-slate-300 mb-1.5 block">New Password *</label>
                <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required minLength={6}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl font-semibold text-white text-sm hover:opacity-90" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                Reset Password
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
