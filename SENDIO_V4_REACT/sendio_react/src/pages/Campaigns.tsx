import { useState, useEffect, useRef } from 'react'
import { api, uploadFile } from '../lib/api'
import { Plus, Play, Pause, Trash2, Upload, Edit, Search, ChevronDown, X, Check } from 'lucide-react'

interface Campaign {
  id: number
  name: string
  status: string
  total_rows: number
  step_count: number
  stats: { total: number; sent: number; replied: number; bounced: number }
  created_at: string
  cols?: string[]
  email_col?: string
}

interface Step {
  id?: number
  step_order: number
  subject: string
  body_html: string
  wait_days: number
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  paused: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  draft: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLORS[status] || STATUS_COLORS.draft}`}>
      {status}
    </span>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl" style={{ background: '#0d1829', border: '1px solid rgba(99,102,241,0.2)' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  )
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [showEditor, setShowEditor] = useState<number | null>(null)
  const [uploadData, setUploadData] = useState<{ cols: string[]; campaign_id: number; total_rows: number } | null>(null)
  const [emailCol, setEmailCol] = useState('')
  const [steps, setSteps] = useState<Step[]>([])
  const [search, setSearch] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const load = () => {
    api.get('/get-campaigns').then((d: Campaign[]) => {
      setCampaigns(d)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await uploadFile('/upload', fd)
      setUploadData(res)
      setEmailCol(res.cols[0] || '')
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  const saveUpload = async () => {
    if (!uploadData) return
    await api.put(`/update-campaign/${uploadData.campaign_id}`, { email_col: emailCol })
    setShowUpload(false)
    setUploadData(null)
    load()
  }

  const openEditor = async (id: number) => {
    setShowEditor(id)
    const ss = await api.get(`/campaign/${id}/steps`) as Step[]
    setSteps(ss.length ? ss : [{ step_order: 1, subject: '', body_html: '', wait_days: 3 }])
  }

  const addStep = () => setSteps(s => [...s, { step_order: s.length + 1, subject: '', body_html: '', wait_days: 3 }])

  const saveSteps = async () => {
    if (!showEditor) return
    // Delete existing and re-create
    const existing = await api.get(`/campaign/${showEditor}/steps`) as Step[]
    for (const s of existing) {
      if (s.id) await api.delete(`/campaign/${showEditor}/steps/${s.id}`)
    }
    for (let i = 0; i < steps.length; i++) {
      await api.post(`/campaign/${showEditor}/steps`, { ...steps[i], step_order: i + 1 })
    }
    setShowEditor(null)
    load()
  }

  const toggleStatus = async (c: Campaign) => {
    if (c.status === 'active') {
      await api.post(`/campaign/${c.id}/pause`, {})
    } else {
      await api.post(`/campaign/${c.id}/start`, {})
    }
    load()
  }

  const deleteCampaign = async (id: number) => {
    if (!confirm('Delete this campaign and all its data?')) return
    await api.delete(`/delete-campaign/${id}`)
    load()
  }

  const createNew = async () => {
    const name = prompt('Campaign name:')
    if (!name) return
    await api.post('/get-campaigns', { name })
    load()
  }

  const filtered = campaigns.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search campaigns..."
            className="pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: '#0d1829', border: '1px solid rgba(99,102,241,0.2)', color: '#f0f4ff', width: 260 }}
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-all"
            style={{ background: '#0d1829', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            <Upload size={16} />
            Upload CSV
          </button>
          <button
            onClick={createNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <Plus size={16} />
            New Campaign
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#0d1829', border: '1px solid rgba(99,102,241,0.15)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
              {['Campaign', 'Status', 'Leads', 'Sent', 'Replies', 'Bounce', 'Steps', 'Actions'].map(h => (
                <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} className="px-5 py-12 text-center text-slate-500">Loading...</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                No campaigns yet. Upload a CSV or create a new campaign to get started.
              </td></tr>
            )}
            {filtered.map(c => (
              <tr key={c.id} className="hover:bg-white/2 transition-colors" style={{ borderBottom: '1px solid rgba(99,102,241,0.06)' }}>
                <td className="px-5 py-4">
                  <div className="font-medium text-white">{c.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{new Date(c.created_at).toLocaleDateString()}</div>
                </td>
                <td className="px-5 py-4"><StatusBadge status={c.status} /></td>
                <td className="px-5 py-4 text-slate-300">{c.total_rows.toLocaleString()}</td>
                <td className="px-5 py-4 text-slate-300">{c.stats?.sent || 0}</td>
                <td className="px-5 py-4 text-green-400">{c.stats?.replied || 0}</td>
                <td className="px-5 py-4 text-red-400">{c.stats?.bounced || 0}</td>
                <td className="px-5 py-4 text-slate-300">{c.step_count || 0}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEditor(c.id)} title="Edit steps" className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all">
                      <Edit size={15} />
                    </button>
                    <button onClick={() => toggleStatus(c)} title={c.status === 'active' ? 'Pause' : 'Start'} className={`p-1.5 rounded-lg transition-all ${c.status === 'active' ? 'text-yellow-400 hover:bg-yellow-500/10' : 'text-green-400 hover:bg-green-500/10'}`}>
                      {c.status === 'active' ? <Pause size={15} /> : <Play size={15} />}
                    </button>
                    <button onClick={() => deleteCampaign(c.id)} title="Delete" className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <Modal title="Upload CSV" onClose={() => { setShowUpload(false); setUploadData(null) }}>
          <div className="space-y-5">
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all hover:border-indigo-400"
              style={{ borderColor: 'rgba(99,102,241,0.3)' }}
            >
              <Upload size={32} className="mx-auto mb-3 text-slate-400" />
              <p className="text-slate-300 font-medium">Drop your CSV here or click to browse</p>
              <p className="text-sm text-slate-500 mt-1">Supports .csv files up to 50MB</p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
            </div>

            {uploadData && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <p className="text-green-400 font-medium">✓ Uploaded {uploadData.total_rows.toLocaleString()} rows</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Which column contains emails?</label>
                  <select
                    value={emailCol}
                    onChange={e => setEmailCol(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: '#131f35', border: '1px solid rgba(99,102,241,0.2)', color: '#f0f4ff' }}
                  >
                    {uploadData.cols.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <button
                  onClick={saveUpload}
                  className="w-full py-3 rounded-xl font-semibold text-white text-sm hover:opacity-90 transition-all"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                  Create Campaign
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Sequence Editor */}
      {showEditor && (
        <Modal title="Sequence Editor" onClose={() => setShowEditor(null)}>
          <div className="space-y-4">
            {steps.map((step, i) => (
              <div key={i} className="p-4 rounded-xl" style={{ background: '#131f35', border: '1px solid rgba(99,102,241,0.15)' }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-indigo-400">Step {i + 1}</span>
                  {steps.length > 1 && (
                    <button onClick={() => setSteps(s => s.filter((_, idx) => idx !== i))} className="text-slate-500 hover:text-red-400"><X size={14} /></button>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Subject</label>
                    <input
                      value={step.subject}
                      onChange={e => setSteps(s => s.map((ss, idx) => idx === i ? { ...ss, subject: e.target.value } : ss))}
                      placeholder="{{first_name}}, quick question about {{company}}"
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: '#0d1829', border: '1px solid rgba(99,102,241,0.2)', color: '#f0f4ff' }}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Body (HTML or plain text)</label>
                    <textarea
                      value={step.body_html}
                      onChange={e => setSteps(s => s.map((ss, idx) => idx === i ? { ...ss, body_html: e.target.value } : ss))}
                      placeholder="Hi {{first_name}},&#10;&#10;I noticed that {{company}} is..."
                      rows={5}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-y"
                      style={{ background: '#0d1829', border: '1px solid rgba(99,102,241,0.2)', color: '#f0f4ff' }}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Wait days before sending</label>
                    <input
                      type="number"
                      value={step.wait_days}
                      onChange={e => setSteps(s => s.map((ss, idx) => idx === i ? { ...ss, wait_days: parseInt(e.target.value) || 0 } : ss))}
                      min={0}
                      className="w-24 px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: '#0d1829', border: '1px solid rgba(99,102,241,0.2)', color: '#f0f4ff' }}
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={addStep}
              className="w-full py-3 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-all"
              style={{ border: '2px dashed rgba(99,102,241,0.3)' }}
            >
              + Add step
            </button>
            <button
              onClick={saveSteps}
              className="w-full py-3 rounded-xl font-semibold text-white text-sm hover:opacity-90 transition-all"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              Save sequence
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
