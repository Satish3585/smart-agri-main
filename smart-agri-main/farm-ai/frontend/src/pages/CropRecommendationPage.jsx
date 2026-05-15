import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sprout, History, Clock } from 'lucide-react'
import Navbar from '../components/common/Navbar'
import Sidebar from '../components/common/Sidebar'
import RecommendationEngine from '../components/crops/RecommendationEngine'
import VoiceAssistant from '../components/common/VoiceAssistant'
import { useAuth } from '../context/AuthContext'
import { cropService } from '../services/cropService'

export default function CropRecommendationPage() {
  const { user } = useAuth()
  const [history, setHistory] = useState([])
  const [tab, setTab] = useState('recommend')

  useEffect(() => {
    cropService.getHistory().then(setHistory).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen">
      <Navbar />
      <Sidebar user={user} />
      <main className="lg:pl-64 pt-16">
        <div className="p-6 max-w-5xl">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Sprout className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="page-title">AI Crop Recommendation</h1>
                <p className="text-gray-400 text-sm">Adaptive Market Balancing — avoids oversupply & price crashes</p>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 glass-card p-1 rounded-2xl w-fit">
            {[
              { id: 'recommend', label: 'Get Recommendation', icon: Sprout },
              { id: 'history',   label: `History (${history.length})`,  icon: History },
            ].map(t => {
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    tab === t.id ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" /> {t.label}
                </button>
              )
            })}
          </div>

          {tab === 'recommend' ? (
            <RecommendationEngine />
          ) : (
            <div className="space-y-3">
              {history.length === 0 ? (
                <div className="glass-card p-12 text-center border border-white/10">
                  <Sprout className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No recommendations yet. Get your first AI analysis!</p>
                </div>
              ) : history.map(h => (
                <motion.div
                  key={h.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-card p-4 border border-white/10"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">{h.top_recommendation || 'Multiple crops'}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        Region: {h.input?.region} · Season: {h.input?.season}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        N:{h.input?.nitrogen} P:{h.input?.phosphorus} K:{h.input?.potassium} pH:{h.input?.ph}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {new Date(h.created_at).toLocaleDateString('en-IN')}
                      </div>
                      <div className="text-xs text-gray-600 mt-0.5">{h.recommendations_count} crops analyzed</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
      <VoiceAssistant />
    </div>
  )
}
