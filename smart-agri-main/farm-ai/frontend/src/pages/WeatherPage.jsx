import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Cloud, AlertTriangle, Droplets } from 'lucide-react'
import Navbar from '../components/common/Navbar'
import Sidebar from '../components/common/Sidebar'
import WeatherCard from '../components/weather/WeatherCard'
import IrrigationPanel from '../components/weather/IrrigationPanel'
import VoiceAssistant from '../components/common/VoiceAssistant'
import { useAuth } from '../context/AuthContext'
import { weatherService } from '../services/weatherService'
import LoadingSpinner from '../components/common/LoadingSpinner'

export default function WeatherPage() {
  const { user } = useAuth()
  const [weather, setWeather] = useState(null)
  const [forecast, setForecast] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('weather')
  const lat = 12.9716, lon = 77.5946

  useEffect(() => {
    const load = async () => {
      try {
        const [w, f, a] = await Promise.all([
          weatherService.getCurrent(lat, lon),
          weatherService.getForecast(lat, lon),
          weatherService.getFarmingAlerts(lat, lon, 'tomato'),
        ])
        setWeather(w)
        setForecast(f)
        setAlerts(a.alerts || [])
      } catch {}
      finally { setLoading(false) }
    }
    load()
  }, [])

  const SEV_COLOR = { warning: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', critical: 'text-red-400 bg-red-500/10 border-red-500/30' }

  return (
    <div className="min-h-screen">
      <Navbar />
      <Sidebar user={user} />
      <main className="lg:pl-64 pt-16">
        <div className="p-6 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center">
                <Cloud className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <h1 className="page-title">Weather Intelligence</h1>
                <p className="text-gray-400 text-sm">Smart irrigation alerts + farming recommendations</p>
              </div>
            </div>
          </motion.div>

          {/* Tab switcher */}
          <div className="flex gap-1 mb-5 glass-card p-1 rounded-2xl w-fit">
            {[
              { id: 'weather',    label: 'Weather', icon: Cloud },
              { id: 'irrigation', label: 'Smart Irrigation', icon: Droplets },
            ].map(t => {
              const Icon = t.icon
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === t.id ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'text-gray-400 hover:text-white'}`}>
                  <Icon className="w-4 h-4" /> {t.label}
                </button>
              )
            })}
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><LoadingSpinner size="lg" text="Fetching weather data..." /></div>
          ) : tab === 'weather' ? (
            <div className="space-y-5">
              <WeatherCard weather={weather} />

              {/* Farming alerts */}
              {alerts.length > 0 && (
                <div className="space-y-2">
                  <h3 className="section-title">Farming Alerts</h3>
                  {alerts.map((alert, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`flex items-start gap-3 p-3 rounded-xl border ${SEV_COLOR[alert.severity] || 'text-gray-400 bg-white/5 border-white/10'}`}
                    >
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-white">{alert.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{alert.message}</p>
                        <p className="text-xs font-medium mt-1 text-emerald-400">Action: {alert.action_required}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* 5-day forecast */}
              {forecast.length > 0 && (
                <div>
                  <h3 className="section-title mb-3">5-Day Forecast</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {forecast.map((day, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="glass-card p-3 text-center border border-white/10"
                      >
                        <p className="text-xs text-gray-400 mb-1">{new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short' })}</p>
                        <img
                          src={`https://openweathermap.org/img/wn/${day.icon}.png`}
                          alt={day.description}
                          className="w-10 h-10 mx-auto"
                          onError={e => { e.target.style.display = 'none' }}
                        />
                        <p className="text-sm font-bold text-white">{Math.round(day.temp_max)}°</p>
                        <p className="text-xs text-gray-500">{Math.round(day.temp_min)}°</p>
                        <p className="text-xs text-sky-400 mt-1">{day.rainfall_probability}% 🌧</p>
                        <p className="text-[10px] text-gray-500 mt-1 leading-tight">{day.farming_advice.slice(0, 40)}...</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <IrrigationPanel lat={lat} lon={lon} />
          )}
        </div>
      </main>
      <VoiceAssistant />
    </div>
  )
}
