import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sprout, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const STATES = ['Karnataka', 'Maharashtra', 'Andhra Pradesh', 'Telangana', 'Tamil Nadu', 'Gujarat', 'Punjab', 'Haryana', 'Rajasthan', 'Uttar Pradesh', 'Madhya Pradesh', 'Bihar']

export default function AuthPage() {
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState(searchParams.get('tab') === 'register' ? 'register' : 'login')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login, register, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => { if (user) navigate('/dashboard') }, [user, navigate])

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [regForm, setRegForm] = useState({
    name: '', email: '', password: '', role: 'farmer',
    phone: '', state: '', district: '', land_size_acres: '',
  })

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(loginForm.email, loginForm.password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!regForm.name || !regForm.email || !regForm.password) {
      toast.error('Fill in all required fields')
      return
    }
    setLoading(true)
    try {
      await register({
        ...regForm,
        land_size_acres: regForm.land_size_acres ? parseFloat(regForm.land_size_acres) : undefined,
      })
      toast.success('Account created! Welcome to Farm AI.')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-hero-gradient" />
      <div className="absolute inset-0 bg-glow-gradient" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shadow-glow">
              <Sprout className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="text-left">
              <div className="text-2xl font-black text-white">Farm <span className="text-gradient">AI</span></div>
              <div className="text-xs text-gray-500">From Soil to Success</div>
            </div>
          </Link>
        </div>

        {/* Tabs */}
        <div className="glass-card p-1 flex gap-1 mb-4 rounded-2xl">
          {['login', 'register'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all capitalize ${
                tab === t ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        <div className="glass-card p-6 border border-white/10">
          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Email</label>
                <input type="email" value={loginForm.email}
                  onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                  placeholder="farmer@example.com" className="input-field" required />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Password</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="••••••••" className="input-field pr-10" required
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Role</label>
                  <select value={regForm.role} onChange={e => setRegForm({ ...regForm, role: e.target.value })}
                    className="input-field text-sm">
                    <option value="farmer" className="bg-navy-900">Farmer</option>
                    <option value="buyer" className="bg-navy-900">Buyer</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Full Name *</label>
                  <input type="text" value={regForm.name}
                    onChange={e => setRegForm({ ...regForm, name: e.target.value })}
                    placeholder="Your name" className="input-field text-sm" required />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Email *</label>
                <input type="email" value={regForm.email}
                  onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                  placeholder="you@example.com" className="input-field" required />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Password *</label>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} value={regForm.password}
                    onChange={e => setRegForm({ ...regForm, password: e.target.value })}
                    placeholder="Min 6 characters" className="input-field pr-10" required />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Phone</label>
                  <input type="tel" value={regForm.phone}
                    onChange={e => setRegForm({ ...regForm, phone: e.target.value })}
                    placeholder="+91 9876543210" className="input-field text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">State</label>
                  <select value={regForm.state} onChange={e => setRegForm({ ...regForm, state: e.target.value })}
                    className="input-field text-sm">
                    <option value="" className="bg-navy-900">Select state</option>
                    {STATES.map(s => <option key={s} value={s} className="bg-navy-900">{s}</option>)}
                  </select>
                </div>
              </div>
              {regForm.role === 'farmer' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">District</label>
                    <input type="text" value={regForm.district}
                      onChange={e => setRegForm({ ...regForm, district: e.target.value })}
                      placeholder="District" className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Land Size (acres)</label>
                    <input type="number" value={regForm.land_size_acres}
                      onChange={e => setRegForm({ ...regForm, land_size_acres: e.target.value })}
                      placeholder="2.5" min="0.1" step="0.1" className="input-field text-sm" />
                  </div>
                </div>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : 'Create Account'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-500 mt-4">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  )
}
