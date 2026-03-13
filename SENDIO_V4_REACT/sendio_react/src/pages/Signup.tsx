import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Mail, Eye, EyeOff, ArrowRight, CheckCircle, ExternalLink } from 'lucide-react'

interface VerifyState {
  email: string
  message: string
  demo_verify_url: string
}

const inputCls = "w-full px-4 py-2.5 rounded-xl text-sm border bg-white text-gray-900 transition-all"
const inputStyle = { border: '1px solid #e2e8f0' }

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', username: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifyState, setVerifyState] = useState<VerifyState | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      const res = await signup(form.username, form.password, form.email, form.name)
      setVerifyState({ email: res.email, message: res.message, demo_verify_url: res.demo_verify_url })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  // ── Verify email screen ──────────────────────────────────────
  if (verifyState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center mx-auto mb-6">
            <Mail size={28} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your inbox</h1>
          <p className="text-muted mb-2">{verifyState.message}</p>
          <p className="text-sm text-muted mb-8">
            We sent a verification link to <strong className="text-gray-800">{verifyState.email}</strong>
          </p>

          {/* Demo mode: show the link directly */}
          <div className="p-4 rounded-xl mb-6 text-left" style={{ background: '#fefce8', border: '1px solid #fde68a' }}>
            <p className="text-xs font-semibold text-amber-700 mb-2">⚡ Demo mode — click to verify instantly:</p>
            <a
              href={verifyState.demo_verify_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-sm text-primary font-medium hover:underline break-all"
            >
              <ExternalLink size={13} className="flex-shrink-0" />
              Open verification link
            </a>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted">After clicking the link above, you'll be redirected to login.</p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-dark transition-all"
            >
              Go to Sign in <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Signup form ──────────────────────────────────────────────
  return (
    <div className="min-h-screen flex bg-page">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-center px-16 py-12 flex-1 bg-primary text-white">
        <div className="flex items-center gap-2.5 mb-12">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <Mail size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold">Sendio</span>
        </div>
        <h2 className="text-4xl font-extrabold mb-4 leading-tight">
          Start booking more meetings today
        </h2>
        <p className="text-white/70 text-lg mb-10">
          Join 10,000+ sales teams sending smarter cold emails that get replies.
        </p>
        {[
          'Multi-step email sequences with A/B testing',
          'Built-in inbox warmup to protect deliverability',
          'Real-time analytics and CRM pipeline',
        ].map(f => (
          <div key={f} className="flex items-center gap-3 mb-4">
            <CheckCircle size={18} className="text-white/80 flex-shrink-0" />
            <span className="text-white/80 text-sm">{f}</span>
          </div>
        ))}
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <Mail size={15} className="text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">Sendio</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h1>
          <p className="text-muted text-sm mb-8">Fill in your details to get started. No credit card required.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">Full name</label>
                <input className={inputCls} style={inputStyle} value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Smith" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">Username *</label>
                <input className={inputCls} style={inputStyle} value={form.username} required
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="johnsmith" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">Work email *</label>
              <input className={inputCls} style={inputStyle} type="email" value={form.email} required
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="john@company.com" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">Password *</label>
              <div className="relative">
                <input className={inputCls} style={{ ...inputStyle, paddingRight: 40 }}
                  type={showPw ? 'text' : 'password'} value={form.password} required minLength={6}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 px-4 py-3 rounded-xl bg-red-50 border border-red-100">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white bg-primary hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? 'Creating account...' : (<>Create account <ArrowRight size={15} /></>)}
            </button>
          </form>

          <p className="text-xs text-gray-400 mt-4 text-center">
            By signing up you agree to our Terms of Service and Privacy Policy.
          </p>
          <p className="text-sm text-center mt-5 text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
