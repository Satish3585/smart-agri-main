import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sprout, TrendingUp, Bug, ShoppingCart, AlertTriangle, Activity } from 'lucide-react'
import Navbar from '../components/common/Navbar'
import Sidebar from '../components/common/Sidebar'
import StatsCard from '../components/dashboard/StatsCard'
import MarketBalancingWidget from '../components/dashboard/MarketBalancingWidget'
import CropTrendChart from '../components/dashboard/CropTrendChart'
import IrrigationStatusCard from '../components/dashboard/IrrigationStatusCard'
import VoiceAssistant from '../components/common/VoiceAssistant'
import { useAuth } from '../context/AuthContext'
import { marketService } from '../services/marketService'
import { weatherService } from '../services/weatherService'

export default function DashboardPage() {
  const { user } = useAuth()
  const [satData, setSatData] = useState([])
  const [trendData, setTrendData] = useState([])
  const [irrigData, setIrrigData] = useState(null)
  const [satLoading, setSatLoading] = useState(true)
  const [irrigLoading, setIrrigLoading] = useState(true)
  const region = user?.state || 'Karnataka'

  useEffect(() => {
    const load = async () => {
      try {
        const [sat, trend] = await Promise.all([
          marketService.getSaturationDashboard(region),
          marketService.getTrends('tomato'),
        ])
        setSatData(sat)
        setTrendData(trend)
      } catch {}
      finally { setSatLoading(false) }

      try {
        const w = await weatherService.getCurrent(12.9716, 77.5946)
        // Use weather for irrigation hint
        const advice = {
          status: w.humidity > 80 ? 'not_required' : 'caution',
          title: w.humidity > 80 ? 'Irrigation Not Required' : 'Monitor Soil Moisture',
          message: `Humidity ${w.humidity}%. ${w.humidity > 80 ? 'No irrigation needed today.' : 'Check soil moisture levels.'}`,
          xai_reasons: [`Current humidity: ${w.humidity}%`, `Temperature: ${w.temperature}°C`],
          next_irrigation: w.humidity > 80 ? 'After 2 days' : 'Today if soil moisture < 45%',
        }
        setIrrigData(advice)
      } catch {} finally { setIrrigLoading(false) }
    }
    load()
  }, [region])

  const criticalAlerts = satData.filter(d => d.saturation_level === 'critical').length
  const opportunities = satData.filter(d => d.saturation_level === 'low').length

  return (
    <div className="min-h-screen">
      <Navbar />
      <Sidebar user={user} />
      <main className="lg:pl-64 pt-16 min-h-screen">
        <div className="p-6 max-w-7xl">
          {/* Welcome */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-2xl font-bold text-white">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
              <span className="text-gradient">{user?.name?.split(' ')[0]}</span> 👋
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {region} region · {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </motion.div>

          {/* Alert banner */}
          {criticalAlerts > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
            >
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-300">
                  {criticalAlerts} crop{criticalAlerts > 1 ? 's' : ''} at critical oversupply risk in {region}
                </p>
                <p className="text-xs text-red-400/70 mt-0.5">
                  Check Market Intelligence for details and alternative crop recommendations.
                </p>
              </div>
            </motion.div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard icon={Sprout}      label="AI Recommendations"  value="12" sub="This month" trend="up" trendValue="+3" color="emerald" delay={0.0} />
            <StatsCard icon={AlertTriangle} label="Critical Alerts"   value={criticalAlerts} sub="Oversupply risk" trend={criticalAlerts > 0 ? 'up' : 'down'} trendValue={criticalAlerts > 0 ? `+${criticalAlerts}` : '0'} color={criticalAlerts > 0 ? 'orange' : 'emerald'} delay={0.1} />
            <StatsCard icon={Activity}    label="Market Opportunities" value={opportunities} sub="Low saturation crops" trend="up" trendValue={`+${opportunities}`} color="blue" delay={0.2} />
            <StatsCard icon={TrendingUp}  label="Profit Potential"    value="₹72K" sub="Top crop estimate/acre" trend="up" trendValue="+8%" color="gold" delay={0.3} />
          </div>

          {/* Main content grid */}
          <div className="grid lg:grid-cols-3 gap-5">
            {/* Left col — 2 wide */}
            <div className="lg:col-span-2 space-y-5">
              <MarketBalancingWidget data={satData} loading={satLoading} />
              <CropTrendChart data={trendData} />
            </div>
            {/* Right col */}
            <div className="space-y-5">
              <IrrigationStatusCard advice={irrigData} loading={irrigLoading} />

              {/* Quick actions */}
              <div className="glass-card p-5 border border-white/10">
                <h3 className="font-bold text-white text-sm mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  {[
                    { to: '/crops',    icon: Sprout,       label: 'Get Crop Recommendation', color: 'text-emerald-400' },
                    { to: '/disease',  icon: Bug,          label: 'Detect Crop Disease',     color: 'text-orange-400' },
                    { to: '/market',   icon: TrendingUp,   label: 'View Market Saturation',  color: 'text-blue-400' },
                    { to: '/commerce', icon: ShoppingCart, label: 'Post Crop Listing',        color: 'text-purple-400' },
                  ].map(a => (
                    <a
                      key={a.to} href={a.to}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group"
                    >
                      <a.icon className={`w-4 h-4 ${a.color}`} />
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{a.label}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <VoiceAssistant />
    </div>
  )
}
