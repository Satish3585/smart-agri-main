import { motion } from 'framer-motion'
import { useState } from 'react'
import { TrendingUp, Users, Star, ChevronDown } from 'lucide-react'
import MarketSaturationBadge from '../common/MarketSaturationBadge'
import AIExplanationCard from '../common/AIExplanationCard'

export default function CropCard({ rec, index, onRegister }) {
  const [expanded, setExpanded] = useState(index === 0)

  const rankColors = ['text-gold-400', 'text-gray-300', 'text-orange-400']
  const rankLabel = ['Best Choice', '2nd Option', '3rd Option']

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`glass-card overflow-hidden border ${
        index === 0 ? 'border-emerald-500/40 shadow-glow' : 'border-white/10'
      }`}
    >
      {/* Top banner for rank 1 */}
      {index === 0 && (
        <div className="bg-gradient-to-r from-emerald-500/20 to-transparent px-5 py-2 border-b border-emerald-500/20">
          <span className="text-xs font-bold text-emerald-400">⭐ AI TOP RECOMMENDATION</span>
        </div>
      )}

      <div className="p-5">
        <div className="flex gap-4">
          {/* Crop image */}
          <div className="relative flex-shrink-0">
            <img
              src={rec.image_url}
              alt={rec.crop_name}
              className="w-20 h-20 rounded-xl object-cover"
              onError={e => { e.target.src = 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4e7?w=200' }}
            />
            <div className={`absolute -top-2 -right-2 w-7 h-7 rounded-full bg-navy-900 border-2 ${index === 0 ? 'border-gold-400' : 'border-gray-600'} flex items-center justify-center text-xs font-bold ${rankColors[index] || 'text-gray-400'}`}>
              {index + 1}
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h3 className="font-bold text-white text-lg leading-tight">{rec.crop_name}</h3>
                <p className="text-xs text-gray-500">{rankLabel[index] || `#${index + 1} Option`}</p>
              </div>
              <MarketSaturationBadge level={rec.saturation_level} index={rec.saturation_index} showIndex />
            </div>

            <div className="grid grid-cols-3 gap-3 mt-3">
              <div>
                <p className="text-xs text-gray-500">Confidence</p>
                <p className="text-sm font-bold text-white">{Math.round(rec.confidence * 100)}%</p>
                <div className="h-1 bg-white/10 rounded-full mt-1">
                  <div className="h-1 bg-emerald-500 rounded-full" style={{ width: `${Math.round(rec.confidence * 100)}%` }} />
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Profit/Acre</p>
                <p className="text-sm font-bold text-gold-400">₹{(rec.expected_profit_per_acre || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Nearby Farmers</p>
                <p className="text-sm font-bold text-white">{rec.farmers_growing_nearby}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Expand section */}
        <div className="mt-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between text-xs text-gray-400 hover:text-white transition-colors"
          >
            <span>View AI Analysis</span>
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </button>

          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-3 space-y-3"
            >
              {/* Scores */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Market Demand', value: Math.round(rec.market_demand_score * 100), color: 'bg-blue-500' },
                  { label: 'Sustainability', value: Math.round(rec.sustainability_score * 100), color: 'bg-emerald-500' },
                  { label: 'Weather Match', value: Math.round(rec.weather_compatibility * 100), color: 'bg-sky-500' },
                  { label: 'Market Safety', value: Math.round((1 - rec.saturation_index) * 100), color: 'bg-purple-500' },
                ].map(s => (
                  <div key={s.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">{s.label}</span>
                      <span className="text-white font-medium">{s.value}%</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full">
                      <div className={`h-1.5 ${s.color} rounded-full`} style={{ width: `${s.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <AIExplanationCard
                reasons={rec.xai_explanation}
                geminiExplanation={rec.gemini_explanation}
              />

              {onRegister && (
                <button
                  onClick={() => onRegister(rec)}
                  className="w-full btn-primary text-sm py-2.5"
                >
                  Register Cultivation & Track Saturation
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
