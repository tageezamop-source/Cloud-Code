import { Link } from 'react-router-dom'
import { Mail, ArrowRight, BarChart2, Shield, Zap, Users, CheckCircle, Star, Play } from 'lucide-react'

const STATS = [
  { label: 'Emails Sent', value: '124M+' },
  { label: 'Avg Open Rate', value: '42%' },
  { label: 'Avg Reply Rate', value: '8.3%' },
  { label: 'Leads Generated', value: '2.1M+' },
]

const FEATURES = [
  { icon: Mail, title: 'Smart Sequences', desc: 'Multi-step drip campaigns with A/B testing and intelligent follow-ups.' },
  { icon: BarChart2, title: 'Deep Analytics', desc: 'Real-time insights on opens, clicks, replies, and revenue attribution.' },
  { icon: Shield, title: 'Inbox Warmup', desc: 'Protect your sender reputation with automated warmup sequences.' },
  { icon: Zap, title: 'Webhook Integrations', desc: 'Connect to Zapier, Make, HubSpot, Slack and more.' },
  { icon: Users, title: 'Built-in CRM', desc: 'Track leads through your pipeline with Kanban boards.' },
  { icon: CheckCircle, title: 'ESP Detection', desc: 'Auto-detect email providers and optimize deliverability per domain.' },
]

export default function Landing() {
  return (
    <div style={{ background: '#f5f5f9', minHeight: '100vh', color: '#1e293b' }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 max-w-7xl mx-auto bg-white rounded-2xl mt-4 shadow-card">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <Mail size={15} className="text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">Sendio</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-muted font-medium">
          <a href="#features" className="hover:text-primary transition-colors">Features</a>
          <a href="#how" className="hover:text-primary transition-colors">How it works</a>
          <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">Sign in</Link>
          <Link to="/signup" className="text-sm font-semibold px-4 py-2 rounded-xl text-white bg-primary hover:bg-primary-dark transition-all">
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center px-6 pt-20 pb-16 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-8 bg-primary-light text-primary border border-indigo-200">
          <Star size={11} fill="currentColor" /> Trusted by 10,000+ sales teams
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6 tracking-tight text-gray-900">
          Cold Email Outreach<br />
          <span className="text-primary">That Actually Works</span>
        </h1>
        <p className="text-xl text-muted mb-10 max-w-2xl mx-auto leading-relaxed">
          Send personalized cold emails at scale. Automate follow-ups, track everything, and book more meetings — without burning your domain.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
          <Link to="/signup"
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white text-sm bg-primary hover:bg-primary-dark transition-all shadow-pop">
            Start free — no credit card <ArrowRight size={15} />
          </Link>
          <button className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:border-primary/30 hover:text-primary transition-all shadow-card">
            <Play size={14} fill="currentColor" /> Watch demo
          </button>
        </div>
        <p className="text-xs text-muted">No credit card required · Free forever plan available</p>
      </section>

      {/* Stats */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map(({ label, value }) => (
            <div key={label} className="text-center p-6 rounded-2xl bg-white shadow-card">
              <div className="text-3xl font-extrabold text-primary mb-1">{value}</div>
              <div className="text-sm text-muted">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-3">Everything you need to scale outreach</h2>
        <p className="text-muted text-center mb-12">All the tools in one platform — no duct tape required.</p>
        <div className="grid md:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-6 rounded-2xl bg-white shadow-card hover:shadow-pop transition-all">
              <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center mb-4">
                <Icon size={20} className="text-primary" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-6 pb-20">
        <div className="text-center p-12 rounded-3xl bg-primary text-white shadow-pop">
          <h2 className="text-3xl font-bold mb-3">Ready to book more meetings?</h2>
          <p className="text-white/70 mb-8">Join thousands of sales teams growing their pipeline with Sendio.</p>
          <Link to="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-primary bg-white hover:bg-gray-50 transition-all text-sm">
            Get started for free <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-sm text-muted border-t border-gray-200">
        © 2024 Sendio. Built for sales teams that mean business.
      </footer>
    </div>
  )
}
