import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sprout, Loader2, MapPin, Thermometer, CloudRain, FlaskConical } from 'lucide-react'
import toast from 'react-hot-toast'
import { cropService } from '../../services/cropService'
import CropCard from './CropCard'

const REGIONS = [
  'Karnataka', 'Maharashtra', 'Andhra Pradesh', 'Telangana',
  'Tamil Nadu', 'Gujarat', 'Punjab', 'Haryana', 'Rajasthan',
  'Uttar Pradesh', 'Madhya Pradesh', 'Bihar', 'West Bengal',
]
const SEASONS = [
  { value: 'kharif', label: 'Kharif (Jun–Oct)' },
  { value: 'rabi', label: 'Rabi (Nov–Mar)' },
  { value: 'zaid', label: 'Zaid (Mar–Jun)' },
]

export default function RecommendationEngine() {
  const [form, setForm] = useState({
    nitrogen: '', phosphorus: '', potassium: '',
    ph: '', humidity: '', temperature: '', rainfall: '',
    region: 'Karnataka', season: 'kharif',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [showRegistration, setShowRegistration] = useState(null)

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nitrogen || !form.phosphorus || !form.potassium || !form.ph) {
      toast.error('Please fill in all NPK and pH values')
      return
    }
    setLoading(true)
    try {
      const data = await cropService.recommend({
        nitrogen: parseFloat(form.nitrogen),
        phosphorus: parseFloat(form.phosphorus),
        potassium: parseFloat(form.potassium),
        ph: parseFloat(form.ph),
        humidity: form.humidity ? parseFloat(form.humidity) : undefined,
        temperature: form.temperature ? parseFloat(form.temperature) : undefined,
        rainfall: form.rainfall ? parseFloat(form.rainfall) : undefined,
        region: form.region,
        season: form.season,
      })
      setResult(data)
      toast.success('AI analysis complete!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (rec) => {
    try {
      const res = await cropService.registerCultivation({
        crop_id: rec.crop_id,
        region: form.region,
        season: form.season,
        land_area_acres: 2.0,
      })
      toast.success(`Registered! Current saturation: ${Math.round(res.current_saturation_index * 100)}%`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 border border-emerald-500/20"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="font-bold text-white">Soil Analysis Input</h2>
            <p className="text-xs text-gray-400">Enter your soil parameters for AI-powered crop recommendations</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* NPK */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Soil NPK Values (kg/ha)</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { name: 'nitrogen', label: 'Nitrogen (N)', placeholder: '0–200' },
                { name: 'phosphorus', label: 'Phosphorus (P)', placeholder: '0–200' },
                { name: 'potassium', label: 'Potassium (K)', placeholder: '0–200' },
              ].map(f => (
                <div key={f.name}>
                  <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
                  <input
                    type="number" name={f.name} value={form[f.name]}
                    onChange={handleChange} placeholder={f.placeholder}
                    className="input-field text-sm"
                    min="0" max="200" step="0.1"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* pH + Climate */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">pH Level</label>
              <input
                type="number" name="ph" value={form.ph} onChange={handleChange}
                placeholder="6.5" className="input-field text-sm"
                min="0" max="14" step="0.1"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <Thermometer className="w-3 h-3" /> Temperature (°C)
              </label>
              <input
                type="number" name="temperature" value={form.temperature} onChange={handleChange}
                placeholder="25" className="input-field text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <CloudRain className="w-3 h-3" /> Rainfall (mm)
              </label>
              <input
                type="number" name="rainfall" value={form.rainfall} onChange={handleChange}
                placeholder="80" className="input-field text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Humidity (%)</label>
              <input
                type="number" name="humidity" value={form.humidity} onChange={handleChange}
                placeholder="65" className="input-field text-sm"
              />
            </div>
          </div>

          {/* Region & Season */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Region
              </label>
              <select name="region" value={form.region} onChange={handleChange} className="input-field text-sm">
                {REGIONS.map(r => <option key={r} value={r} className="bg-navy-900">{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Growing Season</label>
              <select name="season" value={form.season} onChange={handleChange} className="input-field text-sm">
                {SEASONS.map(s => <option key={s.value} value={s.value} className="bg-navy-900">{s.label}</option>)}
              </select>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing with AI...</>
            ) : (
              <><Sprout className="w-4 h-4" /> Get AI Recommendations</>
            )}
          </button>
        </form>
      </motion.div>

      {/* Warning Banner */}
      {result?.warning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-start gap-3 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl"
        >
          <span className="text-lg">⚠️</span>
          <p className="text-sm text-orange-300">{result.warning}</p>
        </motion.div>
      )}

      {/* Results */}
      {result?.recommendations?.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-white text-lg">AI Recommendations</h2>
            <div className="text-xs text-gray-500">
              Analyzed {result.region_saturation_summary?.total_analyzed_crops} crops in{' '}
              {result.region_saturation_summary?.region}
            </div>
          </div>
          {result.recommendations.map((rec, i) => (
            <CropCard key={rec.crop_id} rec={rec} index={i} onRegister={handleRegister} />
          ))}
        </div>
      )}
    </div>
  )
}
