import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { Plus, Trash2, X, Download, Upload, Edit, ChevronRight, User } from 'lucide-react'

interface Contact {
  id: number
  email: string
  first_name: string
  last_name: string
  company: string
  title: string
  stage: string
  tags: string[]
  notes: string
  created_at: string
  activities?: Activity[]
}

interface Activity {
  id: number
  activity: string
  detail: string
  created_at: string
}

const STAGES = ['lead', 'contacted', 'replied', 'interested', 'customer', 'lost']

const STAGE_COLORS: Record<string, string> = {
  lead: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  contacted: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  replied: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  interested: 'bg-green-500/20 text-green-400 border-green-500/30',
  customer: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  lost: 'bg-red-500/20 text-red-400 border-red-500/30',
}

function Avatar({ name, email }: { name: string; email: string }) {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : email.slice(0, 2).toUpperCase()
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#3b82f6', '#22c55e', '#f59e0b']
  const color = colors[email.charCodeAt(0) % colors.length]
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: color }}>
      {initials}
    </div>
  )
}

export default function CRM() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'kanban'>('list')
  const [selected, setSelected] = useState<Contact | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [actNote, setActNote] = useState('')
  const [form, setForm] = useState({ email: '', first_name: '', last_name: '', company: '', title: '', stage: 'lead', notes: '' })

  const load = () => {
    api.get('/crm/contacts').then((d: Contact[]) => { setContacts(d); setLoading(false) }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openContact = async (c: Contact) => {
    const d = await api.get(`/crm/contacts/${c.id}`) as Contact
    setSelected(d)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.post('/crm/contacts', form)
    setShowAdd(false)
    setForm({ email: '', first_name: '', last_name: '', company: '', title: '', stage: 'lead', notes: '' })
    load()
  }

  const deleteContact = async (id: number) => {
    if (!confirm('Delete this contact?')) return
    await api.delete(`/crm/contacts/${id}`)
    setSelected(null)
    load()
  }

  const updateStage = async (id: number, stage: string) => {
    await api.put(`/crm/contacts/${id}`, { stage })
    load()
    if (selected?.id === id) setSelected(s => s ? { ...s, stage } : s)
  }

  const addActivity = async () => {
    if (!selected || !actNote.trim()) return
    await api.post(`/crm/contacts/${selected.id}/activity`, { activity: 'note', detail: actNote })
    setActNote('')
    openContact(selected)
  }

  const exportCSV = () => {
    window.open('/crm/export', '_blank')
  }

  const f = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))
  const inputCls = "w-full px-3 py-2 rounded-xl text-sm outline-none"
  const inputStyle = { background: '#131f35', border: '1px solid rgba(99,102,241,0.2)', color: '#f0f4ff' }

  const byStage = (stage: string) => contacts.filter(c => c.stage === stage)

  return (
    <div className="flex h-full" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 p-6 pb-4">
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(99,102,241,0.2)' }}>
            {(['list', 'kanban'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} className={`px-4 py-2 text-sm font-medium capitalize transition-all ${view === v ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                {v}
              </button>
            ))}
          </div>
          <div className="ml-auto flex gap-3">
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-slate-300 hover:text-white transition-all" style={{ border: '1px solid rgba(99,102,241,0.2)' }}>
              <Download size={15} />Export
            </button>
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Plus size={16} />Add Contact
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-6 pb-6">
          {/* List view */}
          {view === 'list' && (
            <div className="rounded-2xl overflow-hidden" style={{ background: '#0d1829', border: '1px solid rgba(99,102,241,0.15)' }}>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                    {['Contact', 'Company', 'Stage', 'Tags', ''].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading && <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">Loading...</td></tr>}
                  {!loading && contacts.length === 0 && (
                    <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">No contacts yet</td></tr>
                  )}
                  {contacts.map(c => (
                    <tr key={c.id} className="hover:bg-white/2 cursor-pointer transition-colors" style={{ borderBottom: '1px solid rgba(99,102,241,0.06)' }} onClick={() => openContact(c)}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={`${c.first_name} ${c.last_name}`} email={c.email} />
                          <div>
                            <p className="text-sm font-medium text-white">{c.first_name} {c.last_name}</p>
                            <p className="text-xs text-slate-500">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm text-slate-300">{c.company || '—'}</p>
                        <p className="text-xs text-slate-500">{c.title}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${STAGE_COLORS[c.stage] || STAGE_COLORS.lead}`}>{c.stage}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-1 flex-wrap">
                          {c.tags.slice(0, 2).map(t => (
                            <span key={t} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>{t}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <ChevronRight size={16} className="text-slate-600" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Kanban view */}
          {view === 'kanban' && (
            <div className="flex gap-4 min-w-max">
              {STAGES.map(stage => (
                <div key={stage} className="w-64 flex-shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${STAGE_COLORS[stage]}`}>{stage}</span>
                    <span className="text-xs text-slate-500">{byStage(stage).length}</span>
                  </div>
                  <div className="space-y-2">
                    {byStage(stage).map(c => (
                      <div key={c.id} onClick={() => openContact(c)} className="p-4 rounded-xl cursor-pointer hover:scale-102 transition-all" style={{ background: '#0d1829', border: '1px solid rgba(99,102,241,0.15)' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar name={`${c.first_name} ${c.last_name}`} email={c.email} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{c.first_name} {c.last_name}</p>
                            <p className="text-xs text-slate-500 truncate">{c.company}</p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{c.email}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-80 flex flex-col flex-shrink-0 overflow-hidden" style={{ borderLeft: '1px solid rgba(99,102,241,0.12)', background: '#0d1829' }}>
          <div className="p-5" style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
            <div className="flex items-start justify-between mb-4">
              <Avatar name={`${selected.first_name} ${selected.last_name}`} email={selected.email} />
              <div className="flex gap-1">
                <button onClick={() => deleteContact(selected.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                  <Trash2 size={14} />
                </button>
                <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg text-slate-500 hover:text-white"><X size={14} /></button>
              </div>
            </div>
            <h2 className="font-semibold text-white mb-0.5">{selected.first_name} {selected.last_name}</h2>
            <p className="text-sm text-slate-400">{selected.email}</p>
            {selected.company && <p className="text-sm text-slate-500 mt-0.5">{selected.title} @ {selected.company}</p>}
          </div>

          <div className="p-4" style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
            <label className="text-xs text-slate-500 mb-1.5 block">Stage</label>
            <div className="flex flex-wrap gap-1.5">
              {STAGES.map(s => (
                <button key={s} onClick={() => updateStage(selected.id, s)}
                  className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize transition-all ${selected.stage === s ? STAGE_COLORS[s] : 'text-slate-600 border-slate-700 hover:border-slate-500'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {selected.notes && (
            <div className="p-4" style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
              <p className="text-xs text-slate-500 mb-1">Notes</p>
              <p className="text-sm text-slate-300">{selected.notes}</p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Activity Feed</p>
            <div className="space-y-3 mb-4">
              {(selected.activities || []).map(a => (
                <div key={a.id} className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-slate-300">{a.detail}</p>
                    <p className="text-xs text-slate-600">{new Date(a.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {(!selected.activities || selected.activities.length === 0) && (
                <p className="text-xs text-slate-600">No activity yet</p>
              )}
            </div>
            <textarea
              value={actNote}
              onChange={e => setActNote(e.target.value)}
              placeholder="Add a note..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none mb-2"
              style={{ background: '#131f35', border: '1px solid rgba(99,102,241,0.2)', color: '#f0f4ff' }}
            />
            <button onClick={addActivity} disabled={!actNote.trim()} className="w-full py-2 rounded-xl text-sm font-medium text-white disabled:opacity-40 hover:opacity-90" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              Add Note
            </button>
          </div>
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-lg rounded-2xl" style={{ background: '#0d1829', border: '1px solid rgba(99,102,241,0.2)' }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
              <h2 className="text-lg font-semibold text-white">Add Contact</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={submit} className="p-6 space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Email *</label>
                <input value={form.email} onChange={e => f('email', e.target.value)} required className={inputCls} style={inputStyle} placeholder="contact@company.com" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">First Name</label>
                  <input value={form.first_name} onChange={e => f('first_name', e.target.value)} className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Last Name</label>
                  <input value={form.last_name} onChange={e => f('last_name', e.target.value)} className={inputCls} style={inputStyle} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Company</label>
                  <input value={form.company} onChange={e => f('company', e.target.value)} className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Title</label>
                  <input value={form.title} onChange={e => f('title', e.target.value)} className={inputCls} style={inputStyle} />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Stage</label>
                <select value={form.stage} onChange={e => f('stage', e.target.value)} className={inputCls} style={{ ...inputStyle, appearance: 'none' }}>
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Notes</label>
                <textarea value={form.notes} onChange={e => f('notes', e.target.value)} rows={3} className={`${inputCls} resize-none`} style={inputStyle} />
              </div>
              <button type="submit" className="w-full py-3 rounded-xl font-semibold text-white text-sm hover:opacity-90" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                Add Contact
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
