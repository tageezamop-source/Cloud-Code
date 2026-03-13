import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api, uploadFile } from '../lib/api'
import {
  ArrowLeft, Check, Settings, ChevronDown, Upload, Plus, Trash2,
  Clock, Mail, Eye, AlignLeft, AlignCenter, AlignRight, List,
  Bold, Italic, Strikethrough, Link, Image, Smile, Undo, Redo,
  MoreHorizontal, Users, Calendar, Sliders, CheckCircle, X
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Variant {
  id: string
  label: string
  subject: string
  body: string
  enabled: boolean
}

interface SeqStep {
  id?: number
  order: number
  wait_days: number
  variants: Variant[]
}

const VARIANT_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4']
const VARIANT_LABELS = ['A', 'B', 'C', 'D', 'E']

function newVariant(label: string): Variant {
  return { id: Math.random().toString(36).slice(2), label, subject: '', body: '', enabled: true }
}
function newStep(order: number): SeqStep {
  return { order, wait_days: 3, variants: [newVariant('A')] }
}

// ─── Toggle ──────────────────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!on)} className="toggle-track flex-shrink-0 cursor-pointer"
      style={{ background: on ? '#6366f1' : '#cbd5e1' }}>
      <div className="toggle-thumb" style={{ left: on ? 16 : 2 }} />
    </div>
  )
}

// ─── Step Progress ────────────────────────────────────────────────────────────

const STEPS = ['Import Leads', 'Sequences', 'Setup', 'Final Review']

function StepProgress({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((s, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={s} className="flex items-center">
            <div className="flex items-center gap-1.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                done ? 'bg-primary' : active ? 'border-2 border-primary bg-white' : 'border-2 border-gray-200 bg-white'
              }`}>
                {done
                  ? <Check size={11} className="text-white" strokeWidth={3} />
                  : <span className={`text-xs font-bold ${active ? 'text-primary' : 'text-gray-300'}`}>{i + 1}</span>
                }
              </div>
              <span className={`text-xs font-medium whitespace-nowrap ${
                done ? 'text-primary' : active ? 'text-gray-900' : 'text-gray-400'
              }`}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-10 h-px mx-2 ${done ? 'bg-primary' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Toolbar ─────────────────────────────────────────────────────────────────

function Toolbar({ editorRef }: { editorRef: React.RefObject<HTMLDivElement | null> }) {
  const exec = (cmd: string, val?: string) => {
    editorRef.current?.focus()
    document.execCommand(cmd, false, val)
  }
  const btn = (icon: React.ReactNode, cmd: string, val?: string, title?: string) => (
    <button className="tb-btn" title={title} onMouseDown={e => { e.preventDefault(); exec(cmd, val) }}>{icon}</button>
  )
  return (
    <div className="flex items-center gap-0.5 px-3 py-2 flex-wrap" style={{ borderBottom: '1px solid #e2e8f0' }}>
      {btn(<Bold size={14} />, 'bold', undefined, 'Bold')}
      {btn(<Italic size={14} />, 'italic', undefined, 'Italic')}
      {btn(<Strikethrough size={14} />, 'strikethrough', undefined, 'Strike')}
      <div className="w-px h-4 bg-gray-200 mx-1" />
      {btn(<span className="text-xs font-bold">A+</span>, 'fontSize', '4', 'Large')}
      {btn(<span className="text-xs">A-</span>, 'fontSize', '2', 'Small')}
      <div className="w-px h-4 bg-gray-200 mx-1" />
      {btn(<Image size={14} />, 'insertImage', undefined, 'Image')}
      {btn(<Link size={14} />, 'createLink', prompt('URL:') || '', 'Link')}
      {btn(<Smile size={14} />, 'insertText', '😊', 'Emoji')}
      <div className="w-px h-4 bg-gray-200 mx-1" />
      {btn(<AlignLeft size={14} />, 'justifyLeft', undefined, 'Align Left')}
      {btn(<AlignCenter size={14} />, 'justifyCenter', undefined, 'Align Center')}
      {btn(<AlignRight size={14} />, 'justifyRight', undefined, 'Align Right')}
      {btn(<List size={14} />, 'insertUnorderedList', undefined, 'Bullet list')}
      {btn(<AlignLeft size={14} />, 'insertOrderedList', undefined, 'Numbered list')}
      <div className="w-px h-4 bg-gray-200 mx-1" />
      {btn(<Undo size={14} />, 'undo', undefined, 'Undo')}
      {btn(<Redo size={14} />, 'redo', undefined, 'Redo')}
      {btn(<MoreHorizontal size={14} />, 'selectAll', undefined, 'More')}
    </div>
  )
}

// ─── Step 1: Import Leads ────────────────────────────────────────────────────

function StepImportLeads({
  campId, onNext
}: {
  campId: number | null
  onNext: (id: number, emailCol: string, cols: string[], preview: Record<string, string>[]) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ cols: string[]; total_rows: number; preview: Record<string, string>[] } | null>(null)
  const [resolvedId, setResolvedId] = useState<number | null>(campId)
  const [emailCol, setEmailCol] = useState('')
  const [error, setError] = useState('')

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setError('')
    const fd = new FormData()
    fd.append('file', file)
    if (resolvedId) fd.append('campaign_id', String(resolvedId))
    try {
      const res = await uploadFile('/upload', fd)
      setResolvedId(res.campaign_id)
      setUploadResult({ cols: res.cols, total_rows: res.total_rows, preview: res.preview })
      setEmailCol(res.cols.find((c: string) => c.toLowerCase().includes('email')) || res.cols[0] || '')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally { setUploading(false) }
  }

  const handleNext = () => {
    if (!resolvedId || !uploadResult || !emailCol) return
    onNext(resolvedId, emailCol, uploadResult.cols, uploadResult.preview)
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Import your leads</h2>
        <p className="text-muted text-sm mb-8">Upload a CSV file with your prospect list.</p>

        {!uploadResult ? (
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all hover:border-primary hover:bg-primary-light/20"
            style={{ borderColor: '#cbd5e1' }}
          >
            <Upload size={40} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-700 font-medium mb-1">Drop your CSV here or click to browse</p>
            <p className="text-sm text-muted">Supports .csv files up to 50MB</p>
            {uploading && <p className="mt-4 text-sm text-primary font-medium">Uploading...</p>}
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-green-50 border border-green-100 flex items-center gap-3">
              <CheckCircle size={18} className="text-green-500" />
              <div>
                <p className="text-sm font-semibold text-green-700">
                  {uploadResult.total_rows.toLocaleString()} leads imported successfully
                </p>
                <p className="text-xs text-green-600">{uploadResult.cols.length} columns detected</p>
              </div>
              <button onClick={() => { setUploadResult(null); setEmailCol('') }}
                className="ml-auto text-gray-400 hover:text-gray-600"><X size={16} /></button>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-card">
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Which column contains email addresses?
              </label>
              <select value={emailCol} onChange={e => setEmailCol(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm border border-gray-200 bg-white text-gray-900">
                {uploadResult.cols.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Preview table */}
            <div className="bg-white rounded-xl shadow-card overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Preview (first 5 rows)</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      {uploadResult.cols.slice(0, 5).map(c => (
                        <th key={c} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {uploadResult.preview.map((row, i) => (
                      <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                        {uploadResult.cols.slice(0, 5).map(c => (
                          <td key={c} className="px-4 py-2 text-gray-700 truncate max-w-[160px]">{String(row[c] || '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

        <div className="flex justify-end mt-8">
          <button onClick={handleNext} disabled={!uploadResult || !emailCol}
            className="px-8 py-3 rounded-xl font-semibold text-white bg-primary hover:bg-primary-dark transition-all disabled:opacity-40">
            Save & Next
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Step 2: Sequences ────────────────────────────────────────────────────────

function StepSequences({
  campId, onNext
}: {
  campId: number
  onNext: () => void
}) {
  const [steps, setSteps] = useState<SeqStep[]>([newStep(1)])
  const [selStep, setSelStep] = useState(0)
  const [selVariant, setSelVariant] = useState(0)
  const editorRef = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)

  // Load existing steps
  useEffect(() => {
    api.get(`/campaign/${campId}/steps`).then((ss: Array<{ id: number; step_order: number; wait_days: number; variants: Variant[] | null; subject: string; body_html: string }>) => {
      if (ss.length > 0) {
        setSteps(ss.map(s => ({
          id: s.id,
          order: s.step_order,
          wait_days: s.wait_days,
          variants: s.variants || [{ id: 'a', label: 'A', subject: s.subject || '', body: s.body_html || '', enabled: true }],
        })))
      }
    }).catch(() => {})
  }, [campId])

  const curStep = steps[selStep]
  const curVariant = curStep?.variants[selVariant]

  // Sync body from editor
  const syncBody = () => {
    if (!editorRef.current) return
    const html = editorRef.current.innerHTML
    setSteps(ss => ss.map((s, si) => si !== selStep ? s : {
      ...s, variants: s.variants.map((v, vi) => vi !== selVariant ? v : { ...v, body: html })
    }))
  }

  // When selection changes, update editor
  useEffect(() => {
    if (editorRef.current && curVariant) {
      editorRef.current.innerHTML = curVariant.body || ''
    }
  }, [selStep, selVariant])

  const setSubject = (val: string) => setSteps(ss => ss.map((s, si) => si !== selStep ? s : {
    ...s, variants: s.variants.map((v, vi) => vi !== selVariant ? v : { ...v, subject: val })
  }))

  const addVariant = () => {
    const labels = VARIANT_LABELS
    setSteps(ss => ss.map((s, si) => {
      if (si !== selStep) return s
      const nextLabel = labels[s.variants.length] || String(s.variants.length + 1)
      return { ...s, variants: [...s.variants, newVariant(nextLabel)] }
    }))
  }

  const toggleVariant = (vi: number) => setSteps(ss => ss.map((s, si) => si !== selStep ? s : {
    ...s, variants: s.variants.map((v, i) => i === vi ? { ...v, enabled: !v.enabled } : v)
  }))

  const deleteVariant = (vi: number) => setSteps(ss => ss.map((s, si) => {
    if (si !== selStep) return s
    if (s.variants.length <= 1) return s
    const updated = s.variants.filter((_, i) => i !== vi)
    return { ...s, variants: updated }
  }))

  const addStep = () => { setSteps(ss => [...ss, newStep(ss.length + 1)]); setSelStep(steps.length) }
  const deleteStep = (idx: number) => {
    if (steps.length <= 1) return
    setSteps(ss => ss.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i + 1 })))
    setSelStep(Math.max(0, selStep - 1))
  }

  const setWaitDays = (idx: number, val: number) => setSteps(ss => ss.map((s, i) => i !== idx ? s : { ...s, wait_days: val }))

  const saveAndNext = async () => {
    setSaving(true)
    try {
      // Delete existing steps
      const existing = await api.get(`/campaign/${campId}/steps`) as Array<{ id: number }>
      for (const s of existing) await api.delete(`/campaign/${campId}/steps/${s.id}`)
      // Create new
      for (const step of steps) {
        await api.post(`/campaign/${campId}/steps`, {
          step_order: step.order,
          wait_days: step.wait_days,
          subject: step.variants[0]?.subject || '',
          body_html: step.variants[0]?.body || '',
          variants: step.variants,
        })
      }
      onNext()
    } finally { setSaving(false) }
  }

  // Inbox preview row
  const previewSubject = curVariant?.subject || `{{first_name}}`
  const previewBody = curVariant?.body?.replace(/<[^>]+>/g, '').slice(0, 60) || 'Your email preview...'

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── Left panel ── */}
      <div className="flex flex-col overflow-y-auto flex-shrink-0"
        style={{ width: 248, borderRight: '1px solid #e2e8f0', background: '#fff' }}>
        <div className="flex-1 py-3">
          {steps.map((step, si) => (
            <div key={si}>
              {/* Step card */}
              <div className="mx-2 mb-1 rounded-xl overflow-hidden"
                style={{ border: `1px solid ${selStep === si ? '#6366f1' : '#e2e8f0'}`, background: selStep === si ? '#fafafe' : '#fff' }}>
                <div className="flex items-center justify-between px-3 py-2.5 cursor-pointer"
                  onClick={() => { setSelStep(si); setSelVariant(0) }}
                  style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-primary-light flex items-center justify-center">
                      <Mail size={12} className="text-primary" />
                    </div>
                    <span className="text-xs font-semibold text-gray-700">Email follow up</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={e => { e.stopPropagation(); addVariant() }}
                      className="text-xs text-primary hover:underline">A/B</button>
                    {steps.length > 1 && (
                      <button onClick={e => { e.stopPropagation(); deleteStep(si) }}
                        className="p-0.5 text-gray-300 hover:text-red-400 transition-colors">
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Variants */}
                {step.variants.map((v, vi) => (
                  <div key={v.id}
                    onClick={() => { setSelStep(si); setSelVariant(vi) }}
                    className={`seq-variant flex items-center gap-2 px-3 py-2 cursor-pointer ${selStep === si && selVariant === vi ? 'bg-primary-light/30' : ''}`}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: VARIANT_COLORS[vi % VARIANT_COLORS.length] }}>
                      {v.label}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-600 truncate">
                        {v.subject ? `Subject: ${v.subject.slice(0, 18)}...` : 'Subject: ----'}
                      </p>
                    </div>
                    <Toggle on={v.enabled} onChange={() => toggleVariant(vi)} />
                    {step.variants.length > 1 && (
                      <button onClick={e => { e.stopPropagation(); deleteVariant(vi) }}
                        className="text-gray-300 hover:text-red-400 transition-colors">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}

                <button onClick={() => { setSelStep(si); addVariant() }}
                  className="w-full text-left px-3 py-2 text-xs text-primary hover:bg-primary-light/20 font-medium">
                  + Add Variant
                </button>
              </div>

              {/* Wait days */}
              {si < steps.length - 1 && (
                <div className="flex items-center gap-2 px-4 py-2.5 text-xs text-muted">
                  <Clock size={13} className="text-gray-400" />
                  <span>Wait for</span>
                  <input type="number" min={0} value={step.wait_days}
                    onChange={e => setWaitDays(si, parseInt(e.target.value) || 0)}
                    className="w-10 text-center px-1 py-0.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700" />
                  <span>days then</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add step */}
        <div className="p-3" style={{ borderTop: '1px solid #e2e8f0' }}>
          <button onClick={addStep}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-primary hover:bg-primary-light transition-all"
            style={{ border: '1.5px dashed #c7d2fe' }}>
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <Plus size={12} className="text-white" />
            </div>
            Add step
          </button>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-page">
        <div className="flex-1 overflow-y-auto p-5">

          {/* Inbox preview */}
          <div className="bg-white rounded-xl shadow-card mb-4 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <span className="text-sm font-semibold text-gray-700">Inbox Preview</span>
              <div className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center">
                <span className="text-xs text-gray-400 font-bold">?</span>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-all">
              <div className="text-gray-300 text-base">☆</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-gray-800">Sendio</span>
                  <span className="text-sm text-gray-600 truncate">{previewSubject}</span>
                  <span className="text-xs text-gray-400 ml-2 truncate hidden md:block">| {previewBody}</span>
                </div>
              </div>
              <button className="text-gray-300 hover:text-primary transition-colors">
                <Settings size={14} />
              </button>
            </div>
          </div>

          {/* Email editor card */}
          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            {/* Stage selector */}
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                  <span className="text-muted">Stage {selStep + 1}:</span>
                  <span>Email</span>
                  <span className="text-muted">·</span>
                  <span>Variant {curVariant?.label || 'A'}</span>
                  <ChevronDown size={13} className="text-gray-400" />
                </button>
              </div>
              <button className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                <Eye size={13} /> Preview
              </button>
            </div>

            {/* Subject */}
            <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <span className="text-sm font-medium text-gray-500 flex-shrink-0">Subject:</span>
              <input
                className="flex-1 text-sm text-gray-900 bg-transparent outline-none"
                placeholder={`Hi {{first_name}}, quick question about {{company}}`}
                value={curVariant?.subject || ''}
                onChange={e => setSubject(e.target.value)}
              />
              <button className="text-xs font-medium text-primary hover:bg-primary-light px-2 py-1 rounded-lg transition-all flex items-center gap-1">
                <span>{'{}'}</span> Variables
              </button>
            </div>

            {/* Toolbar */}
            <Toolbar editorRef={editorRef} />

            {/* Editable body */}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={syncBody}
              className="min-h-[300px] px-5 py-4 text-sm text-gray-700 outline-none leading-relaxed"
              style={{ caretColor: '#6366f1' }}
              data-placeholder="Write your email here... Use {{first_name}}, {{company}} for personalization"
            />

            {/* Compose with AI */}
            <div className="px-4 py-3" style={{ borderTop: '1px solid #f1f5f9' }}>
              <button className="flex items-center gap-2 text-sm font-medium text-primary hover:bg-primary-light px-3 py-2 rounded-lg transition-all">
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-white text-xs font-bold">AI</span>
                </div>
                Compose with AI
              </button>
            </div>

            {/* Signature hint */}
            <div className="px-4 py-3 bg-gray-50" style={{ borderTop: '1px solid #f1f5f9' }}>
              <p className="text-xs text-gray-400">
                Type <code className="bg-gray-200 px-1 rounded text-gray-600">%signature%</code> to insert your email account's signature where you want it added or it will be added at the end of the email by default.
              </p>
            </div>
          </div>
        </div>

        {/* Save & Next */}
        <div className="flex justify-end px-5 py-4 bg-white" style={{ borderTop: '1px solid #e2e8f0' }}>
          <button onClick={saveAndNext} disabled={saving}
            className="px-8 py-2.5 rounded-xl font-semibold text-white bg-primary hover:bg-primary-dark transition-all disabled:opacity-50">
            {saving ? 'Saving...' : 'Save & Next'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Step 3: Setup ────────────────────────────────────────────────────────────

function StepSetup({ campId, onNext }: { campId: number; onNext: () => void }) {
  const [accounts, setAccounts] = useState<Array<{ id: number; email: string }>>([])
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([])
  const [settings, setSettings] = useState({ plain_text: true, follow_up_all: true, oof_replies: true })

  useEffect(() => {
    api.get('/accounts').then((a: Array<{ id: number; email: string }>) => setAccounts(a)).catch(() => {})
  }, [])

  const toggleAcc = (id: number) => setSelectedAccounts(s =>
    s.includes(id) ? s.filter(x => x !== id) : [...s, id]
  )

  const saveAndNext = async () => {
    await api.put(`/update-campaign/${campId}`, {
      senders: selectedAccounts,
      status: 'draft',
    })
    onNext()
  }

  const Row = ({ icon, title, desc, action, tags }: {
    icon: React.ReactNode; title: string; desc: string; action: React.ReactNode; tags?: string[]
  }) => (
    <div className="flex items-start justify-between py-5 px-6" style={{ borderBottom: '1px solid #f1f5f9' }}>
      <div className="flex items-start gap-3">
        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">{icon}</div>
        <div>
          <p className="text-sm font-semibold text-gray-800 mb-0.5">{title}</p>
          <p className="text-xs text-muted">{desc}</p>
          {tags && (
            <div className="flex gap-2 mt-2">
              {tags.map(t => (
                <span key={t} className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle size={11} />{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div>{action}</div>
    </div>
  )

  return (
    <div className="flex-1 flex items-start justify-center p-8 overflow-y-auto">
      <div className="w-full max-w-xl">
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <Row
            icon={<Check size={13} className="text-green-500" />}
            title="Sender Accounts"
            desc="Who is sending this campaign?"
            action={
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-700">
                  {selectedAccounts.length || accounts.length} Sender Account{accounts.length !== 1 ? 's' : ''}
                </p>
                <button onClick={() => setSelectedAccounts(accounts.map(a => a.id))}
                  className="text-xs text-primary hover:underline mt-0.5">Edit Accounts</button>
              </div>
            }
          />
          {accounts.length > 0 && (
            <div className="px-6 pb-4 flex flex-wrap gap-2">
              {accounts.map(a => (
                <button key={a.id} onClick={() => toggleAcc(a.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    selectedAccounts.includes(a.id) ? 'bg-primary-light text-primary border-primary/30' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-primary/30'
                  }`}>
                  {selectedAccounts.includes(a.id) && <Check size={11} />}
                  {a.email}
                </button>
              ))}
            </div>
          )}

          <Row
            icon={<Check size={13} className="text-green-500" />}
            title="Schedule Campaign"
            desc="Email will be triggered based on time chosen here"
            action={
              <button className="px-4 py-2 rounded-xl text-sm font-medium text-primary bg-primary-light hover:bg-indigo-100 transition-all">
                Schedule Campaign
              </button>
            }
          />

          <Row
            icon={<div className="w-3 h-3 rounded-full border-2 border-gray-300" />}
            title="Campaign Settings"
            desc="Configure the settings for this campaign"
            tags={[
              settings.plain_text ? 'Plain Text' : '',
              settings.follow_up_all ? '100% Follow up leads' : '',
              settings.oof_replies ? 'Adjust OOO Replies' : '',
            ].filter(Boolean)}
            action={
              <button className="px-4 py-2 rounded-xl text-sm font-medium text-primary bg-primary-light hover:bg-indigo-100 transition-all">
                Modify Settings
              </button>
            }
          />
        </div>

        <div className="flex justify-end mt-6">
          <button onClick={saveAndNext}
            className="px-8 py-3 rounded-xl font-semibold text-white bg-primary hover:bg-primary-dark transition-all">
            Save & Next
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Step 4: Final Review ─────────────────────────────────────────────────────

function StepFinalReview({ campId, campName, onLaunch }: { campId: number; campName: string; onLaunch: () => void }) {
  const [steps, setSteps] = useState(0)
  const [rows, setRows] = useState(0)
  const [launching, setLaunching] = useState(false)

  useEffect(() => {
    api.get(`/campaign/${campId}/steps`).then((s: unknown[]) => setSteps(s.length)).catch(() => {})
    api.get(`/load-campaign/${campId}`).then((d: { total_rows: number }) => setRows(d.total_rows)).catch(() => {})
  }, [campId])

  const launch = async () => {
    setLaunching(true)
    await api.post(`/campaign/${campId}/start`, {})
    onLaunch()
  }

  const stat = (label: string, value: string | number, color = 'text-gray-900') => (
    <div className="text-center p-5 bg-white rounded-xl shadow-card">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted mt-1">{label}</p>
    </div>
  )

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-xl text-center">
        <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={28} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to launch!</h2>
        <p className="text-muted mb-8">Review your campaign details before sending.</p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {stat('Campaign Name', campName)}
          {stat('Leads', rows.toLocaleString(), 'text-primary')}
          {stat('Sequence Steps', steps, 'text-primary')}
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-left mb-8">
          <p className="text-sm font-semibold text-amber-700 mb-1">Before you launch:</p>
          <ul className="text-sm text-amber-600 space-y-1">
            <li>• Ensure sender accounts are connected and verified</li>
            <li>• Preview your email sequence one more time</li>
            <li>• Confirm your sending schedule and daily limits</li>
          </ul>
        </div>

        <button onClick={launch} disabled={launching}
          className="w-full py-4 rounded-xl font-bold text-white text-base bg-primary hover:bg-primary-dark transition-all disabled:opacity-50 shadow-pop">
          {launching ? 'Launching...' : '🚀 Launch Campaign'}
        </button>
      </div>
    </div>
  )
}

// ─── Main CampaignEditor ──────────────────────────────────────────────────────

export default function CampaignEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)  // 0=Import,1=Sequences,2=Setup,3=Review
  const [campId, setCampId] = useState<number | null>(id && id !== 'new' ? parseInt(id) : null)
  const [campName, setCampName] = useState('New Campaign')
  const [emailCol, setEmailCol] = useState('')
  const [editingName, setEditingName] = useState(false)

  useEffect(() => {
    if (campId) {
      api.get(`/load-campaign/${campId}`).then((d: { name: string }) => setCampName(d.name)).catch(() => {})
    }
  }, [campId])

  const saveName = async (name: string) => {
    setCampName(name)
    setEditingName(false)
    if (campId) await api.put(`/update-campaign/${campId}`, { name })
  }

  const handleImportDone = async (id: number, col: string) => {
    setCampId(id)
    setEmailCol(col)
    await api.put(`/update-campaign/${id}`, { email_col: col, name: campName })
    setStep(1)
  }

  return (
    <div className="flex flex-col h-screen bg-page overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-3 bg-white flex-shrink-0"
        style={{ borderBottom: '1px solid #e2e8f0', height: 56 }}>
        {/* Left */}
        <div className="flex items-center gap-3 min-w-0" style={{ width: 220 }}>
          <button onClick={() => navigate('/campaigns')}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-all flex-shrink-0">
            <ArrowLeft size={18} />
          </button>
          {editingName ? (
            <input
              autoFocus
              className="text-sm font-semibold text-gray-800 bg-gray-100 px-2 py-1 rounded-lg outline-none border border-primary"
              value={campName}
              onChange={e => setCampName(e.target.value)}
              onBlur={e => saveName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveName(campName)}
              style={{ maxWidth: 180 }}
            />
          ) : (
            <button onClick={() => setEditingName(true)}
              className="text-sm font-semibold text-gray-800 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-all truncate max-w-[160px]">
              {campName}
            </button>
          )}
        </div>

        {/* Center: step progress */}
        <StepProgress current={step} />

        {/* Right */}
        <div className="flex items-center gap-2" style={{ width: 220, justifyContent: 'flex-end' }}>
          <button className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-all">
            <Settings size={16} />
          </button>
          <button className="px-3 py-1.5 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-all">
            Abc
          </button>
        </div>
      </header>

      {/* Step content */}
      <div className="flex-1 flex overflow-hidden">
        {step === 0 && (
          <StepImportLeads campId={campId} onNext={(id, col, _cols, _preview) => handleImportDone(id, col)} />
        )}
        {step === 1 && campId && (
          <StepSequences campId={campId} onNext={() => setStep(2)} />
        )}
        {step === 2 && campId && (
          <StepSetup campId={campId} onNext={() => setStep(3)} />
        )}
        {step === 3 && campId && (
          <StepFinalReview campId={campId} campName={campName} onLaunch={() => navigate('/campaigns')} />
        )}
      </div>
    </div>
  )
}
