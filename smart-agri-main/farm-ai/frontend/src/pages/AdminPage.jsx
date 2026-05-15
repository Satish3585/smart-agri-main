import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Users, Activity, TrendingUp, RefreshCw, AlertTriangle } from 'lucide-react'
import Navbar from '../components/common/Navbar'
import Sidebar from '../components/common/Sidebar'
import StatsCard from '../components/dashboard/StatsCard'
import MarketBalancingWidget from '../components/dashboard/MarketBalancingWidget'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { marketService } from '../services/marketService'

export default function AdminPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [satData, setSatData] = useState([])
  const [users, setUsers] = useState([])
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [s, sat] = await Promise.all([
        api.get('/admin/dashboard'),
        marketService.getSaturationDashboard('Karnataka'),
      ])
      setStats(s)
      setSatData(sat)
    } catch {}
    finally { setLoading(false) }
  }

  const loadUsers = async () => {
    try {
      const data = await api.get('/admin/users')
      setUsers(data.users || [])
    } catch {}
  }

  useEffect(() => { load() }, [])
  useEffect(() => { if (tab === 'users') loadUsers() }, [tab])

  return (
    <div className="min-h-screen">
      <Navbar />
      <Sidebar user={user} />
      <main className="lg:pl-64 pt-16">
        <div className="p-6 max-w-7xl">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold-500/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-gold-400" />
                </div>
                <div>
                  <h1 className="page-title">Admin Control Panel</h1>
                  <p className="text-gray-400 text-sm">Platform analytics, market balance, user management</p>
                </div>
              </div>
              <button onClick={load} className="btn-secondary flex items-center gap-2 py-2 px-4 text-sm">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-1 mb-5 glass-card p-1 rounded-2xl w-fit">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'market',   label: 'Market Balance' },
              { id: 'users',    label: 'Users' },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === t.id ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30' : 'text-gray-400 hover:text-white'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {loading && tab === 'overview' ? (
            <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
          ) : tab === 'overview' && stats ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard icon={Users}     label="Total Farmers" value={stats.total_farmers} trend="up" color="emerald" delay={0} />
                <StatsCard icon={Users}     label="Total Buyers"  value={stats.total_buyers}  trend="up" color="blue"    delay={0.1} />
                <StatsCard icon={Activity}  label="AI Recommendations" value={stats.total_recommendations} color="purple" delay={0.2} />
                <StatsCard icon={AlertTriangle} label="Disease Reports" value={stats.total_disease_reports} color="orange" delay={0.3} />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <StatsCard icon={TrendingUp} label="Active Listings"  value={stats.active_listings}   color="gold"    delay={0} />
                <StatsCard icon={Activity}   label="Completed Orders" value={stats.completed_orders}  color="emerald" delay={0.1} />
                <div className="glass-card p-5 border border-gold-500/20">
                  <p className="text-xs text-gray-400 mb-1">Platform Health Score</p>
                  <div className="text-3xl font-bold text-gold-400">{stats.platform_health_score}%</div>
                  <div className="h-2 bg-white/10 rounded-full mt-2">
                    <div className="h-2 bg-gold-500 rounded-full" style={{ width: `${stats.platform_health_score}%` }} />
                  </div>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="glass-card p-4 border border-emerald-500/20">
                  <p className="text-xs text-gray-400 mb-1">Top Growing Crop</p>
                  <p className="text-lg font-bold text-white capitalize">{stats.top_growing_crop}</p>
                </div>
                <div className="glass-card p-4 border border-red-500/20">
                  <p className="text-xs text-gray-400 mb-1">Highest Saturation Crop</p>
                  <p className="text-lg font-bold text-white capitalize">{stats.highest_saturation_crop}</p>
                </div>
              </div>
            </div>
          ) : tab === 'market' ? (
            <MarketBalancingWidget data={satData} loading={loading} />
          ) : tab === 'users' ? (
            <div className="space-y-2">
              {users.map(u => (
                <div key={u.id} className="glass-card p-4 border border-white/10 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-white">{u.name}</div>
                    <div className="text-xs text-gray-400">{u.email} · {u.state}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full border ${
                      u.role === 'farmer' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                      u.role === 'buyer'  ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' :
                      'bg-gold-500/15 text-gold-400 border-gold-500/30'
                    }`}>{u.role}</span>
                    <span className="text-xs text-gray-500">{new Date(u.created_at).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <div className="glass-card p-12 text-center border border-white/10">
                  <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No users found</p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  )
}
