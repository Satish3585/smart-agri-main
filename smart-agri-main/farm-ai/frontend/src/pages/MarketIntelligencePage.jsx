import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, AlertTriangle, RefreshCw, Filter } from 'lucide-react'
import Navbar from '../components/common/Navbar'
import Sidebar from '../components/common/Sidebar'
import SaturationIndicator from '../components/market/SaturationIndicator'
import MarketChart from '../components/market/MarketChart'
import LoadingSpinner from '../components/common/LoadingSpinner'
import VoiceAssistant from '../components/common/VoiceAssistant'
import { useAuth } from '../context/AuthContext'
import { marketService } from '../services/marketService'

const REGIONS = ['Karnataka', 'Maharashtra', 'Andhra Pradesh', 'Telangana', 'Tamil Nadu', 'Gujarat']
const SEASONS = [{ v: 'kharif', l: 'Kharif' }, { v: 'rabi', l: 'Rabi' }, { v: 'zaid', l: 'Zaid' }]
const CROP_IDS = ['tomato', 'chili', 'onion', 'potato', 'rice', 'wheat']

export default function MarketIntelligencePage() {
  const { user } = useAuth()
  const [region, setRegion] = useState(user?.state || 'Karnataka')
  const [season, setSeason] = useState('kharif')
  const [selectedCrop, setSelectedCrop] = useState('tomato')
  const [dashboard, setDashboard] = useState([])
  const [trends, setTrends] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('saturation')

  const load = async () => {
    setLoading(true)
    try {
      const [dash, alr, trd] = await Promise.all([
        marketService.getSaturationDashboard(region, season),
        marketService.getAlerts(region, season),
        marketService.getTrends(selectedCrop),
      ])
      setDashboard(dash)
      setAlerts(alr)
      setTrends(trd)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [region, season, selectedCrop])

  return (
    <div className="min-h-screen">
      <Navbar />
      <Sidebar user={user} />
      <main className="lg:pl-64 pt-16">
        <div className="p-6 max-w-7xl">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h1 className="page-title">Market Intelligence</h1>
                  <p className="text-gray-400 text-sm">Adaptive saturation tracking — detect oversupply before it hits</p>
                </div>
              </div>
              <button onClick={load} className="btn-secondary flex items-center gap-2 py-2 px-4 text-sm">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>
          </motion.div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <select value={region} onChange={e => setRegion(e.target.value)} className="input-field w-auto text-sm py-2">
              {REGIONS.map(r => <option key={r} value={r} className="bg-navy-900">{r}</option>)}
            </select>
            {SEASONS.map(s => (
              <button key={s.v} onClick={() => setSeason(s.v)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${season === s.v ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'glass text-gray-400 hover:text-white'}`}>
                {s.l}
              </button>
            ))}
          </div>

          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="mb-6 space-y-2">
              {alerts.slice(0, 3).map((alert, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-start gap-3 p-3 rounded-xl border ${
                    alert.severity === 'critical'
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-orange-500/10 border-orange-500/30'
                  }`}
                >
                  <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${alert.severity === 'critical' ? 'text-red-400' : 'text-orange-400'}`} />
                  <div>
                    <p className="text-sm font-semibold text-white">{alert.crop_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{alert.message}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 mb-5 glass-card p-1 rounded-2xl w-fit">
            {[
              { id: 'saturation', label: 'Saturation Map' },
              { id: 'trends', label: 'Price Trends' },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === t.id ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 hover:text-white'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><LoadingSpinner size="lg" text="Loading market data..." /></div>
          ) : tab === 'saturation' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {dashboard.map(item => <SaturationIndicator key={item.crop_id} item={item} />)}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {CROP_IDS.map(c => (
                  <button key={c} onClick={() => setSelectedCrop(c)}
                    className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-all ${selectedCrop === c ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'glass text-gray-400 hover:text-white'}`}>
                    {c}
                  </button>
                ))}
              </div>
              <MarketChart data={trends} cropName={selectedCrop} />
            </div>
          )}
        </div>
      </main>
      <VoiceAssistant />
    </div>
  )
}
