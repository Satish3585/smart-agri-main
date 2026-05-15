import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bug, History, Clock, ChevronRight, Activity,
  ShieldCheck, ScanLine, BarChart3,
} from 'lucide-react'
import Navbar from '../components/common/Navbar'
import Sidebar from '../components/common/Sidebar'
import DiseaseUpload from '../components/disease/DiseaseUpload'
import VoiceAssistant from '../components/common/VoiceAssistant'
import { useAuth } from '../context/AuthContext'
import { diseaseService } from '../services/diseaseService'

const SEV_CFG = {
  none:     { color: 'text-emerald-400', bg: 'bg-emerald-500/12', border: 'border-emerald-500/25', dot: 'bg-emerald-500' },
  low:      { color: 'text-yellow-400',  bg: 'bg-yellow-500/12',  border: 'border-yellow-500/25',  dot: 'bg-yellow-400'  },
  medium:   { color: 'text-orange-400',  bg: 'bg-orange-500/12',  border: 'border-orange-500/25',  dot: 'bg-orange-400'  },
  high:     { color: 'text-red-400',     bg: 'bg-red-500/12',     border: 'border-red-500/25',     dot: 'bg-red-400'     },
  critical: { color: 'text-red-500',     bg: 'bg-red-500/15',     border: 'border-red-500/30',     dot: 'bg-red-500'     },
}

function ScanStatCard({ icon: Icon, label, value, color, glowColor }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-4 border border-white/10 flex items-center gap-3"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${glowColor}18`, border: `1px solid ${glowColor}30` }}
      >
        <Icon className="w-5 h-5" style={{ color: glowColor }} />
      </div>
      <div>
        <p className="text-lg font-extrabold text-white leading-none">{value}</p>
        <p className="text-[11px] text-gray-500 mt-0.5">{label}</p>
      </div>
    </motion.div>
  )
}

export default function DiseaseDetectionPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState('detect')
  const [history, setHistory] = useState([])
  const [stats, setStats] = useState(null)
  const [loadingHistory, setLoadingHistory] = useState(true)

  useEffect(() => {
    setLoadingHistory(true)
    Promise.allSettled([
      diseaseService.getHistory(),
      diseaseService.getStats(),
    ]).then(([histRes, statsRes]) => {
      if (histRes.status === 'fulfilled') setHistory(histRes.value)
      if (statsRes.status === 'fulfilled') setStats(statsRes.value)
    }).finally(() => setLoadingHistory(false))
  }, [])

  const TABS = [
    { id: 'detect',  label: 'Detect Disease', Icon: ScanLine },
    { id: 'history', label: `History (${history.length})`, Icon: History },
  ]

  return (
    <div className="min-h-screen">
      <Navbar />
      <Sidebar user={user} />

      <main className="lg:pl-64 pt-16">
        <div className="p-5 max-w-2xl">

          {/* ── Page header ── */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-start gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)' }}
              >
                <Bug className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-white">AI Disease Detection</h1>
                <p className="text-gray-400 text-sm mt-0.5">
                  Deep Learning · CNN · Explainable AI · Real-time Analysis
                </p>
              </div>
            </div>

            {/* Quick stats */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
                <ScanStatCard icon={ScanLine}   label="Total Scans"      value={stats.total_scans}    glowColor="#10b981" />
                <ScanStatCard icon={Bug}        label="Diseases Found"   value={stats.diseases_detected ?? 0} glowColor="#f97316" />
                <ScanStatCard icon={Activity}   label="Critical Cases"   value={stats.critical_cases ?? 0}    glowColor="#ef4444" />
                <ScanStatCard icon={ShieldCheck}label="Diseases in Model" value={stats.total_diseases ?? 17}  glowColor="#a3e635" />
              </div>
            )}
          </motion.div>

          {/* ── Tab bar ── */}
          <div className="flex gap-1 mb-5 glass-card p-1 rounded-2xl w-fit border border-white/8">
            {TABS.map(t => {
              const Icon = t.Icon
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    tab === t.id
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/35'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              )
            })}
          </div>

          {/* ── Tab content ── */}
          <AnimatePresence mode="wait">
            {tab === 'detect' ? (
              <motion.div
                key="detect"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
              >
                <DiseaseUpload />
              </motion.div>
            ) : (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="space-y-3"
              >
                {loadingHistory ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="glass-card p-4 border border-white/8 animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-white/10 rounded w-40" />
                          <div className="h-2.5 bg-white/6 rounded w-24" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : history.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass-card p-14 text-center border border-white/8"
                  >
                    <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">No disease scans yet</p>
                    <p className="text-gray-600 text-sm mt-1">Upload a leaf image to get started</p>
                    <button
                      onClick={() => setTab('detect')}
                      className="mt-4 btn-primary text-sm px-5 py-2"
                      style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
                    >
                      Start Scanning
                    </button>
                  </motion.div>
                ) : (
                  history.map((h, i) => {
                    const cfg = SEV_CFG[h.severity] || SEV_CFG.medium
                    return (
                      <motion.div
                        key={h.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`glass-card p-4 border ${cfg.border} hover:bg-white/5 transition-all cursor-default`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Severity dot */}
                          <div className={`w-10 h-10 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center flex-shrink-0`}>
                            <div className={`w-3 h-3 rounded-full ${cfg.dot}`} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-bold text-white text-sm leading-tight truncate">
                                  {h.disease_name}
                                </p>
                                {h.crop_type && (
                                  <p className="text-[10px] text-gray-500 mt-0.5 capitalize">{h.crop_type}</p>
                                )}
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                            </div>

                            <div className="flex items-center gap-3 mt-2">
                              <span className={`text-xs font-semibold capitalize ${cfg.color}`}>
                                {h.severity} severity
                              </span>
                              <span className="text-gray-600 text-xs">
                                {Math.round(h.confidence * 100)}% confidence
                              </span>
                            </div>

                            {/* Confidence bar mini */}
                            <div className="mt-2 h-1 bg-white/8 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500"
                                style={{ width: `${Math.round(h.confidence * 100)}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-[10px] text-gray-500 flex-shrink-0 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {new Date(h.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <VoiceAssistant />
    </div>
  )
}
