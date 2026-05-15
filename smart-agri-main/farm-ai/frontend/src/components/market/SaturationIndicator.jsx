import { motion } from 'framer-motion'
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'

const COLOR_MAP = { low: '#10b981', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' }

export default function SaturationIndicator({ item }) {
  const pct = Math.round(item.saturation_index * 100)
  const color = COLOR_MAP[item.saturation_level] || '#10b981'
  const data = [{ value: pct, fill: color }]

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="glass-card p-4 border border-white/10 text-center"
    >
      <div className="relative h-24 w-full">
        <ResponsiveContainer>
          <RadialBarChart innerRadius={28} outerRadius={42} data={data} startAngle={180} endAngle={0}>
            <RadialBar dataKey="value" background={{ fill: 'rgba(255,255,255,0.05)' }} cornerRadius={6} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-end justify-center pb-1">
          <span className="text-base font-bold" style={{ color }}>{pct}%</span>
        </div>
      </div>

      <img
        src={item.image_url}
        alt={item.crop_name}
        className="w-10 h-10 rounded-full object-cover mx-auto -mt-2 mb-2 border-2"
        style={{ borderColor: color }}
        onError={e => { e.target.style.display = 'none' }}
      />
      <h4 className="font-semibold text-white text-sm">{item.crop_name}</h4>
      <p className="text-xs text-gray-500 mt-0.5">{item.farmers_count} farmers</p>
      <span
        className="inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-full"
        style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}
      >
        {item.saturation_level?.toUpperCase()}
      </span>
      {item.alert && (
        <p className="text-xs text-red-400 mt-2 bg-red-500/10 p-1.5 rounded-lg">{item.alert}</p>
      )}
    </motion.div>
  )
}
