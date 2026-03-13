import { Link } from 'react-router-dom'
import { Mail, ArrowRight, BarChart2, Shield, Zap, Users, CheckCircle, Star } from 'lucide-react'

const STATS = [
  { label: 'Emails Sent', value: '124M+' },
  { label: 'Avg Open Rate', value: '42%' },
  { label: 'Avg Reply Rate', value: '8.3%' },
  { label: 'Leads Generated', value: '2.1M+' },
]

const FEATURES = [
  {
    icon: Mail,
    title: 'Smart Sequences',
    desc: 'Multi-step drip campaigns with intelligent follow-ups that adapt to prospect behavior.',
  },
  {
    icon: BarChart2,
    title: 'Deep Analytics',
    desc: 'Real-time insights on opens, clicks, replies, and revenue attribution.',
  },
  {
    icon: Shield,
    title: 'Inbox Warmup',
    desc: 'Protect your sender reputation with automated warmup sequences.',
  },
  {
    icon: Zap,
    title: 'Webhook Integrations',
    desc: 'Connect to Zapier, Make, HubSpot, Slack and more via powerful webhooks.',
  },
  {
    icon: Users,
    title: 'Built-in CRM',
    desc: 'Track leads through your pipeline with Kanban boards and activity feeds.',
  },
  {
    icon: CheckCircle,
    title: 'ESP Detection',
    desc: 'Automatically detect email providers and optimize deliverability per domain.',
  },
]

const STEPS = [
  { n: '01', title: 'Upload your leads', desc: 'Import your CSV with any columns and map the email field.' },
  { n: '02', title: 'Build your sequence', desc: 'Create multi-step email sequences with personalization variables.' },
  { n: '03', title: 'Launch & track', desc: 'Start sending and monitor opens, clicks, and replies in real-time.' },
]

export default function Landing() {
  return (
    <div style={{ background: '#07101e', minHeight: '100vh', color: '#f0f4ff' }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <Mail size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold text-white">Sendio</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm text-slate-400 hover:text-white transition-colors">Sign in</Link>
          <Link to="/signup" className="text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center px-6 pt-20 pb-24 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-8" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }}>
          <Star size={12} fill="currentColor" />
          Trusted by 10,000+ sales teams worldwide
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
          Cold Email Outreach<br />
          <span style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            That Actually Works
          </span>
        </h1>
        <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Send personalized cold emails at scale. Automate follow-ups, track everything, and book more meetings — without burning your domain.
        </p>

        {/* OAuth buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
          <Link
            to="/signup"
            className="flex items-center gap-3 px-6 py-3.5 rounded-xl font-medium text-sm border transition-all hover:bg-white/5"
            style={{ border: '1px solid rgba(255,255,255,0.15)', color: '#f0f4ff', background: 'rgba(255,255,255,0.03)' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/></svg>
            Continue with Google
          </Link>
          <Link
            to="/signup"
            className="flex items-center gap-3 px-6 py-3.5 rounded-xl font-medium text-sm border transition-all hover:bg-white/5"
            style={{ border: '1px solid rgba(255,255,255,0.15)', color: '#f0f4ff', background: 'rgba(255,255,255,0.03)' }}
          >
            <svg width="18" height="18" viewBox="0 0 21 21"><path fill="#f25022" d="M1 1h9v9H1z"/><path fill="#00a4ef" d="M11 1h9v9h-9z"/><path fill="#7fba00" d="M1 11h9v9H1z"/><path fill="#ffb900" d="M11 11h9v9h-9z"/></svg>
            Continue with Microsoft
          </Link>
        </div>

        <p className="text-slate-500 text-sm mb-10">or</p>

        <Link
          to="/signup"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        >
          Start for free — no credit card
          <ArrowRight size={16} />
        </Link>
      </section>

      {/* Stats */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map(({ label, value }) => (
            <div key={label} className="text-center p-6 rounded-2xl" style={{ background: '#0d1829', border: '1px solid rgba(99,102,241,0.15)' }}>
              <div className="text-3xl font-extrabold mb-1" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {value}
              </div>
              <div className="text-sm text-slate-400">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <h2 className="text-3xl font-bold text-center mb-4">Everything you need to scale outreach</h2>
        <p className="text-slate-400 text-center mb-12">All the tools in one platform — no duct tape required.</p>
        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-6 rounded-2xl transition-all hover:scale-105" style={{ background: '#0d1829', border: '1px solid rgba(99,102,241,0.15)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(99,102,241,0.15)' }}>
                <Icon size={20} style={{ color: '#6366f1' }} />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
        <div className="space-y-6">
          {STEPS.map(({ n, title, desc }) => (
            <div key={n} className="flex gap-6 p-6 rounded-2xl" style={{ background: '#0d1829', border: '1px solid rgba(99,102,241,0.15)' }}>
              <div className="text-3xl font-extrabold flex-shrink-0" style={{ color: 'rgba(99,102,241,0.4)' }}>{n}</div>
              <div>
                <h3 className="font-semibold text-white mb-1">{title}</h3>
                <p className="text-sm text-slate-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center px-6 pb-24">
        <div className="max-w-2xl mx-auto p-12 rounded-3xl" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.3)' }}>
          <h2 className="text-3xl font-bold mb-4">Ready to book more meetings?</h2>
          <p className="text-slate-400 mb-8">Join thousands of sales teams already using Sendio to grow their pipeline.</p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white text-sm hover:opacity-90 transition-all"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            Get started for free
            <ArrowRight size={16} />
          </Link>
          <p className="mt-4 text-xs text-slate-500">No credit card required. Free forever plan available.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-slate-600 text-sm" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        © 2024 Sendio. Built for sales teams that mean business.
      </footer>
    </div>
  )
}
