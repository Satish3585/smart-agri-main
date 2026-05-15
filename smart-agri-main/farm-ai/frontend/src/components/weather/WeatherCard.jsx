import { motion } from 'framer-motion'
import { Thermometer, Droplets, Wind, Eye } from 'lucide-react'

export default function WeatherCard({ weather, loading = false }) {
  if (loading) {
    return <div className="glass-card p-5 border border-white/10"><div className="skeleton h-40 rounded-xl" /></div>
  }
  if (!weather) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-5 border border-sky-500/20"
      style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.05), rgba(15,23,42,0.8))' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-white text-lg">{weather.city}</h3>
          <p className="text-gray-400 text-sm capitalize">{weather.description}</p>
        </div>
        <img
          src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
          alt={weather.description}
          className="w-16 h-16"
          onError={e => { e.target.style.display = 'none' }}
        />
      </div>

      <div className="text-5xl font-bold text-white mb-1">
        {Math.round(weather.temperature)}°<span className="text-2xl text-gray-400">C</span>
      </div>
      <p className="text-gray-400 text-sm mb-4">Feels like {Math.round(weather.feels_like)}°C</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Droplets, label: 'Humidity', value: `${weather.humidity}%`, color: 'text-sky-400' },
          { icon: Wind, label: 'Wind', value: `${weather.wind_speed} m/s`, color: 'text-blue-400' },
          { icon: Eye, label: 'Visibility', value: `${weather.visibility} km`, color: 'text-gray-400' },
          { icon: Thermometer, label: 'Pressure', value: `${weather.pressure} hPa`, color: 'text-purple-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white/5 rounded-xl p-3 text-center">
            <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-sm font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
