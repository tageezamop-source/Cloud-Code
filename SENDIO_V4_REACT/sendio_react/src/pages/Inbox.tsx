import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { Send, Circle, Tag, RefreshCw, Filter } from 'lucide-react'

interface Message {
  id: number
  account_email: string
  campaign_id: number | null
  from_email: string
  subject: string
  body: string
  is_read: boolean
  replied: boolean
  category: string
  received_at: string
}

const CATEGORIES = ['all', 'interested', 'not_interested', 'oof', 'uncategorized']

const CAT_COLORS: Record<string, string> = {
  interested: 'text-green-400 bg-green-500/10 border-green-500/20',
  not_interested: 'text-red-400 bg-red-500/10 border-red-500/20',
  oof: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  uncategorized: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
}

export default function Inbox() {
  const [messages, setMessages] = useState<Message[]>([])
  const [selected, setSelected] = useState<Message | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  const load = () => {
    const params = new URLSearchParams()
    if (unreadOnly) params.set('unread', '1')
    if (filter !== 'all') params.set('category', filter)
    api.get(`/inbox?${params}`).then((d: { messages: Message[]; unread: number }) => {
      setMessages(d.messages)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [filter, unreadOnly])

  const openMsg = async (msg: Message) => {
    setSelected(msg)
    setReply('')
    if (!msg.is_read) {
      await api.post(`/inbox/${msg.id}/mark-read`, {})
      setMessages(ms => ms.map(m => m.id === msg.id ? { ...m, is_read: true } : m))
    }
  }

  const sendReply = async () => {
    if (!selected || !reply.trim()) return
    setSending(true)
    try {
      await api.post(`/inbox/${selected.id}/reply`, { body: reply })
      setMessages(ms => ms.map(m => m.id === selected.id ? { ...m, replied: true } : m))
      setSelected(s => s ? { ...s, replied: true } : s)
      setReply('')
      alert('Reply sent!')
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  const categorize = async (category: string) => {
    if (!selected) return
    await api.post(`/inbox/${selected.id}/categorize`, { category })
    setMessages(ms => ms.map(m => m.id === selected.id ? { ...m, category } : m))
    setSelected(s => s ? { ...s, category } : s)
  }

  return (
    <div className="flex h-full" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Message list */}
      <div className="flex flex-col" style={{ width: 340, borderRight: '1px solid rgba(99,102,241,0.12)', background: '#0d1829' }}>
        {/* Filters */}
        <div className="p-4 space-y-3" style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
          <div className="flex gap-2">
            <button
              onClick={() => setUnreadOnly(u => !u)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${unreadOnly ? 'bg-indigo-600/30 text-indigo-300' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Circle size={10} className={unreadOnly ? 'fill-indigo-400 text-indigo-400' : ''} />
              Unread only
            </button>
            <button onClick={load} className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-white">
              <RefreshCw size={15} />
            </button>
          </div>
          <div className="flex gap-1 flex-wrap">
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all capitalize ${filter === c ? 'bg-indigo-600/30 text-indigo-300' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {c === 'all' ? 'All' : c.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading && <div className="p-6 text-center text-slate-500">Loading...</div>}
          {!loading && messages.length === 0 && (
            <div className="p-6 text-center text-slate-500">No messages found</div>
          )}
          {messages.map(msg => (
            <button
              key={msg.id}
              onClick={() => openMsg(msg)}
              className={`w-full text-left p-4 transition-all hover:bg-white/3 ${selected?.id === msg.id ? 'bg-indigo-600/10' : ''}`}
              style={{ borderBottom: '1px solid rgba(99,102,241,0.07)' }}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className={`text-sm font-medium truncate ${msg.is_read ? 'text-slate-300' : 'text-white'}`}>
                  {!msg.is_read && <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 mr-1.5 align-middle" />}
                  {msg.from_email}
                </span>
                <span className="text-xs text-slate-500 flex-shrink-0">
                  {new Date(msg.received_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-slate-400 truncate">{msg.subject}</p>
              <p className="text-xs text-slate-600 truncate mt-0.5">{msg.body?.slice(0, 80)}</p>
              <div className="flex items-center gap-2 mt-1.5">
                {msg.category && msg.category !== 'uncategorized' && (
                  <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${CAT_COLORS[msg.category] || CAT_COLORS.uncategorized}`}>
                    {msg.category.replace('_', ' ')}
                  </span>
                )}
                {msg.replied && <span className="text-xs text-slate-500">↳ replied</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Message detail */}
      {selected ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-6" style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">{selected.subject}</h2>
                <p className="text-sm text-slate-400">From: <span className="text-slate-300">{selected.from_email}</span></p>
                <p className="text-xs text-slate-500 mt-0.5">To: {selected.account_email}</p>
              </div>
              {/* Categorize */}
              <div className="flex gap-2">
                {['interested', 'not_interested', 'oof'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => categorize(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize ${selected.category === cat ? CAT_COLORS[cat] : 'text-slate-500 border-slate-700 hover:border-slate-500'}`}
                  >
                    {cat.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            <div
              className="text-sm leading-relaxed email-body"
              style={{ color: '#c8d3ea' }}
              dangerouslySetInnerHTML={{ __html: selected.body?.replace(/\n/g, '<br>') || '' }}
            />
          </div>

          {/* Reply box */}
          <div className="p-6" style={{ borderTop: '1px solid rgba(99,102,241,0.1)' }}>
            <textarea
              value={reply}
              onChange={e => setReply(e.target.value)}
              placeholder="Write your reply..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none mb-3"
              style={{ background: '#131f35', border: '1px solid rgba(99,102,241,0.2)', color: '#f0f4ff' }}
            />
            <div className="flex justify-end">
              <button
                onClick={sendReply}
                disabled={!reply.trim() || sending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                <Send size={15} />
                {sending ? 'Sending...' : 'Send reply'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-500">
          Select a message to read
        </div>
      )}
    </div>
  )
}
