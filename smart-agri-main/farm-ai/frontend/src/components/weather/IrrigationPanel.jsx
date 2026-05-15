import { useState } from 'react'
import { motion } from 'framer-motion'
import { Droplets, Loader2, Settings } from 'lucide-react'
import { weatherService } from '../../services/weatherService'
import IrrigationStatusCard from '../dashboard/IrrigationStatusCard'
import AIExplanationCard from '../common/AIExplanationCard'
import toast from 'react-hot-toast'

const CROP_TYPES = ['tomato', 'rice', 'wheat', 'chili', 'potato', 'onion', 'maize', 'cotton', 'banana', 'sugarcane']

export default function IrrigationPanel({ lat = 12.9716, lon = 77.5946 }) {
  const [cropType, setCropType] = useState('tomato')
  const [soilMoisture, setSoilMoisture] = useState(50)
  const [lastDays, setLastDays] = useState(2)
  const [advice, setAdvice] = useState(null)
  const [loading, setLoading] = useState(false)

  const getAdvice = async () => {
    setLoading(true)
    try {
      const data = await weatherService.getIrrigationAdvice(lat, lon, cropType, soilMoisture, lastDays)
      setAdvice(data.irrigation_advice)
      toast.success('Irrigation analysis ready')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5 border border-blue-500/20"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Droplets className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold text-white">Smart Irrigation AI</h3>
            <p className="text-xs text-gray-400">Personalized water management with XAI</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Crop Type</label>
            <div className="flex flex-wrap gap-1.5">
              {CROP_TYPES.map(c => (
                <button
                  key={c}
                  onClick={() => setCropType(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-all ${
                    cropType === c
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                      : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-2 block">
                Soil Moisture: <span className="text-white font-semibold">{soilMoisture}%</span>
              </label>
              <input
                type="range" min="0" max="100" value={soilMoisture}
                onChange={e => setSoilMoisture(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>Dry (0%)</span><span>Saturated (100%)</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-2 block">
                Last Irrigated: <span className="text-white font-semibold">{lastDays} days ago</span>
              </label>
              <input
                type="range" min="0" max="14" value={lastDays}
                onChange={e => setLastDays(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>Today</span><span>14 days</span>
              </div>
            </div>
          </div>

          <button onClick={getAdvice} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Droplets className="w-4 h-4" /> Get Irrigation Advice</>}
          </button>
        </div>
      </motion.div>

      {advice && (
        <>
          <IrrigationStatusCard advice={advice} />
          {advice.crop_specific_advice && (
            <div className="glass-card p-4 border border-emerald-500/20">
              <h4 className="text-sm font-semibold text-emerald-400 mb-2">Crop-Specific Advice — {cropType}</h4>
              <p className="text-xs text-gray-300">{advice.crop_specific_advice}</p>
            </div>
          )}
          <AIExplanationCard reasons={advice.xai_reasons} title="Why This Irrigation Decision?" />
        </>
      )}
    </div>
  )
}
