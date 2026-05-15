import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { AlertTriangle, CheckCircle, TrendingUp, Activity } from 'lucide-react'
import MarketSaturationBadge from '../common/MarketSaturationBadge'

const SAT_COLORS = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="glass-dark p-3 rounded-xl text-xs">
      <p className="font-bold text-white mb-1">{d.crop_name}</p>
      <p className="text-gray-300">Saturation: <span className="text-white">{Math.round(d.saturation_index * 100)}%</span></p>
      <p className="text-gray-300">Farmers: <span className="text-white">{d.farmers_count}</span></p>
      <p className="text-gray-300">Profit: <span className="text-white">₹{d.expected_profit?.toLocaleString()}/acre</span></p>
    </div>
  )
}

export default function MarketBalancingWidget({ data = [], loading = false }) {
  if (loading) {
    return (
      <div className="glass-card p-5 border border-emerald-500/20">
        <div className="h-60 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Loading market data...</p>
          </div>
        </div>
      </div>
    )
  }

  const critical = data.filter(d => d.saturation_level === 'critical').length
  const low = data.filter(d => d.saturation_level === 'low').length
  const chartData = data.slice(0, 8).map(d => ({
    ...d,
    saturation_pct: Math.round(d.saturation_index * 100),
  }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 border border-emerald-500/20"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Adaptive Market Balancing AI</h3>
            <p className="text-xs text-gray-500">Real-time saturation monitoring</p>
          </div>
        </div>
        <div className="flex gap-2">
          {critical > 0 && (
            <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/15 border border-red-500/30 px-2 py-1 rounded-full">
              <AlertTriangle className="w-3 h-3" /> {critical} critical
            </span>
          )}
          {low > 0 && (
            <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-1 rounded-full">
              <CheckCircle className="w-3 h-3" /> {low} opportunity
            </span>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="h-48 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barSize={28}>
            <XAxis dataKey="crop_name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} unit="%" />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
            <Bar dataKey="saturation_pct" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={SAT_COLORS[entry.saturation_level] || '#10b981'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {[
          { level: 'low', label: 'Low (Opportunity)' },
          { level: 'medium', label: 'Medium' },
          { level: 'high', label: 'High (Caution)' },
          { level: 'critical', label: 'Critical (Risk)' },
        ].map(({ level, label }) => (
          <div key={level} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: SAT_COLORS[level] }} />
            <span className="text-xs text-gray-400">{label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
