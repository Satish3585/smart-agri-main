import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function StatsCard({ icon: Icon, label, value, sub, trend, trendValue, color = 'emerald', delay = 0 }) {
  const colors = {
    emerald: { bg: 'bg-emerald-500/15', border: 'border-emerald-500/25', icon: 'text-emerald-400', val: 'text-emerald-300' },
    gold:    { bg: 'bg-gold-500/15',    border: 'border-gold-500/25',    icon: 'text-gold-400',    val: 'text-gold-300' },
    blue:    { bg: 'bg-blue-500/15',    border: 'border-blue-500/25',    icon: 'text-blue-400',    val: 'text-blue-300' },
    purple:  { bg: 'bg-purple-500/15',  border: 'border-purple-500/25',  icon: 'text-purple-400',  val: 'text-purple-300' },
    orange:  { bg: 'bg-orange-500/15',  border: 'border-orange-500/25',  icon: 'text-orange-400',  val: 'text-orange-300' },
  }
  const c = colors[color] || colors.emerald

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`glass-card p-5 ${c.border} border`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
        {trendValue && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trendColor}`}>
            <TrendIcon className="w-3 h-3" />
            {trendValue}
          </div>
        )}
      </div>
      <div className={`text-2xl font-bold ${c.val} mb-0.5`}>{value}</div>
      <div className="text-sm font-medium text-white">{label}</div>
      {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
    </motion.div>
  )
}
