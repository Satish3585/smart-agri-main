import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Sprout, Brain, TrendingUp, Bug, Cloud, ShoppingCart, Star, ArrowRight, ChevronRight } from 'lucide-react'

const FEATURES = [
  { icon: Brain,        title: 'Adaptive Market AI',  desc: 'Detects oversupply before it happens. Dynamically shifts recommendations to avoid price crashes.', color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  { icon: Sprout,       title: 'AI Crop Advisor',     desc: 'Soil NPK + weather + saturation analysis. Top crop picks with full XAI explanations.', color: 'text-lime-400', bg: 'bg-lime-500/15' },
  { icon: Bug,          title: 'Disease Vision AI',   desc: 'CNN-powered leaf disease detection. Instant treatment protocols in seconds.', color: 'text-orange-400', bg: 'bg-orange-500/15' },
  { icon: Cloud,        title: 'Smart Irrigation',    desc: 'Weather + soil moisture analysis. Prevents water waste and crop stress.', color: 'text-sky-400', bg: 'bg-sky-500/15' },
  { icon: TrendingUp,   title: 'Market Intelligence', desc: 'Real-time price predictions and competition tracking across your region.', color: 'text-blue-400', bg: 'bg-blue-500/15' },
  { icon: ShoppingCart, title: 'Direct Marketplace',  desc: 'Sell directly to buyers. No middlemen. Maximum farmer profit.', color: 'text-purple-400', bg: 'bg-purple-500/15' },
]

const STATS = [
  { value: '10,000+', label: 'Farmers Served' },
  { value: '94%',     label: 'Prediction Accuracy' },
  { value: '20+',     label: 'Crops Tracked' },
  { value: '8',       label: 'States Covered' },
]

const TESTIMONIALS = [
  { name: 'Ravi Kumar', state: 'Karnataka', text: 'Farm AI warned me about tomato oversupply. Switched to chili and earned 40% more profit this season!', rating: 5 },
  { name: 'Sunita Patel', state: 'Maharashtra', text: 'The disease detection saved my entire crop. It detected early blight before I could see it visibly.', rating: 5 },
  { name: 'Mahesh Reddy', state: 'Andhra Pradesh', text: 'Smart irrigation alerts saved me ₹15,000 in water costs. The AI explains everything clearly.', rating: 5 },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-navy-900/80 border-b border-white/8">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <Sprout className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="font-bold text-white text-lg">Farm <span className="text-gradient">AI</span></span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="text-gray-400 hover:text-white text-sm transition-colors">Login</Link>
            <Link to="/auth?tab=register" className="btn-primary py-2 px-5 text-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* BG effects */}
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute inset-0 bg-glow-gradient" />
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-emerald-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-lime-500/6 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center py-20">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold px-4 py-2 rounded-full mb-6">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Powered by Explainable AI
            </div>

            <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
              From Soil to{' '}
              <span className="text-gradient">Success</span>
              {' '}with AI
            </h1>

            <p className="text-gray-300 text-lg leading-relaxed mb-4">
              India's first AI-powered agriculture ecosystem that doesn't just predict —
              it <span className="text-emerald-400 font-semibold">explains why</span>.
            </p>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              Our Adaptive Market Balancing AI tracks regional crop cultivation trends in real-time,
              helping farmers avoid oversupply and price crashes — <em>before they happen</em>.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link to="/auth" className="btn-primary flex items-center gap-2 text-base px-7 py-3.5">
                Start for Free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/auth" className="btn-secondary flex items-center gap-2 text-base px-7 py-3.5">
                View Demo
              </Link>
            </div>

            <div className="flex flex-wrap gap-6 mt-8">
              {STATS.map(s => (
                <div key={s.label}>
                  <div className="text-2xl font-bold text-gradient">{s.value}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Hero visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden lg:flex items-center justify-center"
          >
            <div className="relative w-full max-w-md">
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="glass-card p-6 border border-emerald-500/40 shadow-glow-lg"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">AI Recommendation</p>
                    <p className="text-xs text-gray-500">Adaptive Market Analysis</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { crop: 'Chili', confidence: 92, sat: 'Low', color: '#10b981' },
                    { crop: 'Onion', confidence: 87, sat: 'Low', color: '#10b981' },
                    { crop: 'Tomato', confidence: 61, sat: 'Critical', color: '#ef4444' },
                  ].map(r => (
                    <div key={r.crop} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-semibold text-white">{r.crop}</span>
                          <span style={{ color: r.color }}>{r.sat}</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full">
                          <div className="h-1.5 rounded-full" style={{ width: `${r.confidence}%`, background: r.color }} />
                        </div>
                      </div>
                      <span className="text-xs font-bold text-white">{r.confidence}%</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-xs text-orange-300">
                  ⚠ Tomato has 73% saturation in your region — 47 farmers growing it. AI recommends Chili instead.
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="text-sm text-emerald-400 font-semibold mb-3 uppercase tracking-widest">Features</div>
            <h2 className="text-4xl font-black text-white mb-4">
              Everything a farmer <span className="text-gradient">needs</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              An integrated AI platform designed from the ground up for Indian farmers — combining intelligence, explainability, and actionability.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -6 }}
                  className="glass-card p-6 border border-white/10 group"
                >
                  <div className={`w-12 h-12 rounded-2xl ${f.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 ${f.color}`} />
                  </div>
                  <h3 className="font-bold text-white text-lg mb-2">{f.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gradient-to-b from-transparent via-emerald-900/5 to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl font-black text-white">Farmers <span className="text-gradient">trust</span> Farm AI</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-5 border border-white/10"
              >
                <div className="flex gap-1 mb-3">
                  {Array(t.rating).fill(0).map((_, j) => <Star key={j} className="w-4 h-4 text-gold-400 fill-gold-400" />)}
                </div>
                <p className="text-gray-300 text-sm italic mb-4">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-white text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.state}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-4xl font-black text-white mb-4">
              Ready to farm <span className="text-gradient">smarter</span>?
            </h2>
            <p className="text-gray-400 mb-8">Join thousands of farmers using AI to maximize profits and avoid market risks.</p>
            <Link to="/auth" className="btn-gold text-base px-10 py-4 inline-flex items-center gap-2">
              Get Started Free <ChevronRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <span>© 2025 Farm AI. Technology farmers can trust.</span>
          <span className="text-gradient font-semibold">Powered by Explainable AI</span>
        </div>
      </footer>
    </div>
  )
}
