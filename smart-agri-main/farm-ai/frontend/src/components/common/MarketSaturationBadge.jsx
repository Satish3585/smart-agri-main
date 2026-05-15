import { TrendingDown, TrendingUp, Minus, AlertTriangle } from 'lucide-react'

const CONFIG = {
  low:      { label: 'Low Competition', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30', icon: TrendingUp },
  medium:   { label: 'Medium Saturation', color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30', icon: Minus },
  high:     { label: 'High Saturation', color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/30', icon: TrendingDown },
  critical: { label: 'Oversupply Risk', color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30', icon: AlertTriangle },
}

export default function MarketSaturationBadge({ level = 'low', index, showIndex = false, size = 'sm' }) {
  const cfg = CONFIG[level] || CONFIG.low
  const Icon = cfg.icon
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
  const padding = size === 'sm' ? 'px-2.5 py-1' : 'px-3 py-1.5'

  return (
    <span className={`inline-flex items-center gap-1.5 ${padding} rounded-full border ${cfg.bg} ${cfg.color} ${textSize} font-semibold`}>
      <Icon className={iconSize} />
      {cfg.label}
      {showIndex && index !== undefined && (
        <span className="opacity-70">({Math.round(index * 100)}%)</span>
      )}
    </span>
  )
}
