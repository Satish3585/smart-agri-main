import { motion } from 'framer-motion'
import { Droplets, CheckCircle, AlertCircle, Info } from 'lucide-react'

const STATUS_CONFIG = {
  required:     { color: 'text-blue-400',    bg: 'bg-blue-500/15',    border: 'border-blue-500/30',    icon: Droplets,    label: 'Irrigation Required' },
  not_required: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', icon: CheckCircle, label: 'No Irrigation Needed' },
  caution:      { color: 'text-yellow-400',  bg: 'bg-yellow-500/15',  border: 'border-yellow-500/30',  icon: AlertCircle, label: 'Moderate Irrigation' },
}

export default function IrrigationStatusCard({ advice, loading = false }) {
  if (loading) {
    return (
      <div className="glass-card p-5 border border-white/10">
        <div className="skeleton h-24 w-full rounded-xl" />
      </div>
    )
  }

  if (!advice) return null

  const cfg = STATUS_CONFIG[advice.status] || STATUS_CONFIG.caution
  const Icon = cfg.icon

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`glass-card p-5 border ${cfg.border}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${cfg.color}`} />
        </div>
        <div>
          <h3 className={`font-bold text-sm ${cfg.color}`}>{advice.title}</h3>
          <p className="text-xs text-gray-500">Smart Irrigation AI</p>
        </div>
      </div>

      <p className="text-sm text-gray-300 mb-3">{advice.message}</p>

      {advice.water_amount_liters_per_acre && (
        <div className="flex items-center gap-2 text-xs text-blue-300 bg-blue-500/10 px-3 py-2 rounded-lg mb-3">
          <Droplets className="w-3.5 h-3.5" />
          Recommended: {advice.water_amount_liters_per_acre.toLocaleString()} litres/acre
        </div>
      )}

      {advice.next_irrigation && (
        <div className="flex items-start gap-2 text-xs text-gray-400">
          <Info className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
          {advice.next_irrigation}
        </div>
      )}

      {advice.water_saving_tip && (
        <div className="mt-3 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-lg">
          💡 {advice.water_saving_tip}
        </div>
      )}
    </motion.div>
  )
}
