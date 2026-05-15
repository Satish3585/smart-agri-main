import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Save, Loader2, Globe } from 'lucide-react'
import Navbar from '../components/common/Navbar'
import Sidebar from '../components/common/Sidebar'
import VoiceAssistant from '../components/common/VoiceAssistant'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/authService'
import toast from 'react-hot-toast'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
]
const STATES = ['Karnataka', 'Maharashtra', 'Andhra Pradesh', 'Telangana', 'Tamil Nadu', 'Gujarat', 'Punjab', 'Haryana']

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({
    name:             user?.name || '',
    phone:            user?.phone || '',
    state:            user?.state || '',
    district:         user?.district || '',
    land_size_acres:  user?.land_size_acres || '',
    preferred_language: user?.preferred_language || 'en',
  })
  const [saving, setSaving] = useState(false)

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await authService.updateProfile(form)
      updateUser(updated)
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <Sidebar user={user} />
      <main className="lg:pl-64 pt-16">
        <div className="p-6 max-w-xl">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-500/20 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <h1 className="page-title">My Profile</h1>
                <p className="text-gray-400 text-sm">Manage your farm profile and preferences</p>
              </div>
            </div>
          </motion.div>

          {/* Avatar + info */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 border border-white/10 mb-5 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shadow-glow">
              <span className="text-2xl font-bold text-emerald-400">{user?.name?.[0]?.toUpperCase() || 'F'}</span>
            </div>
            <div>
              <div className="font-bold text-white text-xl">{user?.name}</div>
              <div className="text-sm text-gray-400">{user?.email}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  user?.role === 'farmer' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                }`}>{user?.role}</span>
                {user?.state && <span className="text-xs text-gray-500">{user.state}</span>}
              </div>
            </div>
          </motion.div>

          {/* Edit form */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="glass-card p-6 border border-white/10">
            <h3 className="font-bold text-white mb-4">Edit Profile</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Full Name</label>
                <input type="text" name="name" value={form.name} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Phone Number</label>
                <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 9876543210" className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">State</label>
                  <select name="state" value={form.state} onChange={handleChange} className="input-field">
                    <option value="" className="bg-navy-900">Select state</option>
                    {STATES.map(s => <option key={s} value={s} className="bg-navy-900">{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">District</label>
                  <input type="text" name="district" value={form.district} onChange={handleChange} placeholder="Your district" className="input-field" />
                </div>
              </div>
              {user?.role === 'farmer' && (
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Land Size (acres)</label>
                  <input type="number" name="land_size_acres" value={form.land_size_acres} onChange={handleChange} placeholder="2.5" min="0.1" step="0.1" className="input-field" />
                </div>
              )}

              {/* Language preference */}
              <div>
                <label className="text-xs text-gray-400 mb-2 flex items-center gap-1 block">
                  <Globe className="w-3.5 h-3.5" /> Preferred Language
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {LANGUAGES.map(l => (
                    <button
                      key={l.code} type="button"
                      onClick={() => setForm({ ...form, preferred_language: l.code })}
                      className={`px-3 py-2 rounded-xl text-sm text-left transition-all ${
                        form.preferred_language === l.code
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
              </button>
            </form>
          </motion.div>
        </div>
      </main>
      <VoiceAssistant />
    </div>
  )
}
