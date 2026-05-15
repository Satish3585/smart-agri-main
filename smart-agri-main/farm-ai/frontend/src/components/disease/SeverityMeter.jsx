import { motion } from 'framer-motion'

const LEVELS = [
  { id: 'none',     label: 'Healthy',  color: '#10b981', tailwind: 'bg-emerald-500', text: 'text-emerald-400' },
  { id: 'low',      label: 'Mild',     color: '#facc15', tailwind: 'bg-yellow-400',  text: 'text-yellow-400'  },
  { id: 'medium',   label: 'Moderate', color: '#fb923c', tailwind: 'bg-orange-400',  text: 'text-orange-400'  },
  { id: 'high',     label: 'Severe',   color: '#f87171', tailwind: 'bg-red-400',     text: 'text-red-400'     },
  { id: 'critical', label: 'Critical', color: '#dc2626', tailwind: 'bg-red-600',     text: 'text-red-500'     },
]

export default function SeverityMeter({ severity }) {
  const activeIndex = LEVELS.findIndex(l => l.id === severity)
  const active = LEVELS[activeIndex] ?? LEVELS[0]

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">Disease Severity</span>
        <span className={`text-xs font-bold ${active.text}`}>{active.label}</span>
      </div>

      {/* Segmented bar */}
      <div className="flex gap-1 h-2.5 rounded-full overflow-hidden">
        {LEVELS.map((level, i) => {
          const isActive = i === activeIndex
          const isFilled = i <= activeIndex
          return (
            <motion.div
              key={level.id}
              className="flex-1 rounded-full"
              style={{
                background: isFilled ? level.color : 'rgba(255,255,255,0.08)',
                boxShadow: isActive ? `0 0 10px 2px ${level.color}88` : 'none',
              }}
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: 'easeOut' }}
            />
          )
        })}
      </div>

      {/* Labels */}
      <div className="flex justify-between">
        {LEVELS.map((level, i) => (
          <span
            key={level.id}
            className={`text-[9px] font-medium ${i === activeIndex ? active.text : 'text-gray-600'}`}
          >
            {level.label}
          </span>
        ))}
      </div>
    </div>
  )
}
