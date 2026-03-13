import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Mail, Eye, EyeOff, CheckCircle } from 'lucide-react'

const inputCls = "w-full px-4 py-2.5 rounded-xl text-sm border bg-white text-gray-900 transition-all"
const inputStyle = { border: '1px solid #e2e8f0' }

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const justVerified = params.get('verified') === '1'

  const [form, setForm] = useState({ username: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.username, form.password)
      navigate('/campaigns')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-page px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Mail size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">Sendio</span>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-card">
          <h1 className="text-xl font-bold text-gray-900 mb-1 text-center">Welcome back</h1>
          <p className="text-sm text-muted text-center mb-6">Sign in to your Sendio account</p>

          {justVerified && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5 bg-green-50 border border-green-100">
              <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
              <p className="text-sm text-green-700 font-medium">Email verified! You can now sign in.</p>
            </div>
          )}

          {/* OAuth buttons */}
          <div className="space-y-2.5 mb-5">
            <button className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-all">
              <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/></svg>
              Continue with Google
            </button>
            <button className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-all">
              <svg width="18" height="18" viewBox="0 0 21 21"><path fill="#f25022" d="M1 1h9v9H1z"/><path fill="#00a4ef" d="M11 1h9v9h-9z"/><path fill="#7fba00" d="M1 11h9v9H1z"/><path fill="#ffb900" d="M11 11h9v9h-9z"/></svg>
              Continue with Microsoft
            </button>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">or sign in with username</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">Username</label>
              <input className={inputCls} style={inputStyle} type="text" value={form.username} required
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="your username" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-600">Password</label>
                <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
              </div>
              <div className="relative">
                <input className={inputCls} style={{ ...inputStyle, paddingRight: 40 }}
                  type={showPw ? 'text' : 'password'} value={form.password} required
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
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
              className="w-full py-3 rounded-xl font-semibold text-white bg-primary hover:bg-primary-dark transition-all disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-5">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary font-medium hover:underline">Sign up free</Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Demo: <span className="text-gray-600 font-medium">admin / admin123</span>
        </p>
      </div>
    </div>
  )
}
