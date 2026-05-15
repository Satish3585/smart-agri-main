import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle, AlertTriangle, Brain, ChevronDown, Volume2,
  Activity, Target, Zap, RefreshCw,
} from 'lucide-react'
import SeverityMeter from './SeverityMeter'
import SmartAlerts from './SmartAlerts'
import TreatmentCards from './TreatmentCards'

// ── Confidence Gauge (SVG circular) ──────────────────────────────────────────
function ConfidenceGauge({ value }) {
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const filled = (value / 100) * circumference
  const color = value >= 85 ? '#10b981' : value >= 70 ? '#f59e0b' : '#f87171'

  return (
    <div className="relative w-24 h-24 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
        <motion.circle
          cx="44" cy="44" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - filled }}
          transition={{ duration: 1.3, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-xl font-extrabold text-white leading-none"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, type: 'spring' }}
        >
          {value}%
        </motion.span>
        <span className="text-[9px] text-gray-400 mt-0.5">confidence</span>
      </div>
    </div>
  )
}

// ── XAI Section ───────────────────────────────────────────────────────────────
function XAISection({ reasons }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-semibold text-emerald-400">Computer Vision Analysis</span>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
            XAI
          </span>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2 border-t border-emerald-500/15 pt-3">
              {reasons.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ x: -8, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.07 }}
                  className="flex items-start gap-2 text-xs text-gray-300"
                >
                  <span className="text-emerald-500 flex-shrink-0 mt-0.5">▸</span>
                  <span>{r}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
const SEV_BORDER = {
  none:     'border-emerald-500/30',
  low:      'border-yellow-500/30',
  medium:   'border-orange-500/40',
  high:     'border-red-400/40',
  critical: 'border-red-500/50',
}
const SEV_GLOW = {
  none:     '',
  low:      '',
  medium:   '0 0 20px rgba(249,115,22,0.12)',
  high:     '0 0 24px rgba(248,113,113,0.15)',
  critical: '0 0 30px rgba(239,68,68,0.2)',
}

export default function DiseaseResult({ result, cropImage }) {
  const isHealthy  = result.disease_id === 'healthy'
  const confidence = Math.round(result.confidence * 100)
  const border = SEV_BORDER[result.severity] || SEV_BORDER.medium
  const glow   = SEV_GLOW[result.severity]   || ''

  const speakResult = () => {
    if (!('speechSynthesis' in window)) return
    const text = isHealthy
      ? `Your plant is healthy. Confidence: ${confidence}%.`
      : `Disease detected: ${result.disease_name}. Confidence: ${confidence}%. Severity: ${result.severity}. ${result.urgency}.`
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      className={`glass-card p-5 border ${border} space-y-5`}
      style={{ boxShadow: glow || undefined }}
    >
      {/* ── Header row ── */}
      <div className="flex items-start gap-4">
        <ConfidenceGauge value={confidence} />

        <div className="flex-1 min-w-0">
          {/* Disease name + voice */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                {isHealthy
                  ? <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  : <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                }
                <h3 className="font-extrabold text-white text-base leading-tight">{result.disease_name}</h3>
              </div>
              {result.crop_type && (
                <span className="text-[10px] text-gray-500">Crop: {result.crop_type}</span>
              )}
            </div>
            <button
              onClick={speakResult}
              title="Read aloud"
              className="w-7 h-7 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center
                         hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all flex-shrink-0"
            >
              <Volume2 className="w-3.5 h-3.5 text-gray-400 hover:text-emerald-400" />
            </button>
          </div>

          {/* Urgency badge */}
          <div className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg text-[11px] font-semibold
                          ${isHealthy ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-orange-500/15 text-orange-400 border border-orange-500/30'}`}>
            {isHealthy ? <CheckCircle className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
            {result.urgency}
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: Target,   label: 'Affected Area', value: `${result.affected_area_percentage}%`,   color: 'text-orange-400' },
          { icon: Activity, label: 'Spread Risk',   value: `${result.spread_risk ?? 0}/10`,          color: result.spread_risk >= 7 ? 'text-red-400' : 'text-yellow-400' },
          { icon: RefreshCw,label: 'Severity Score',value: `${result.severity_score ?? 0}/10`,       color: result.severity_score >= 7 ? 'text-red-400' : 'text-orange-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-white/5 rounded-xl p-2.5 text-center border border-white/8">
            <stat.icon className={`w-3.5 h-3.5 ${stat.color} mx-auto mb-1`} />
            <p className={`font-bold text-sm ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Severity meter ── */}
      <SeverityMeter severity={result.severity} />

      {/* ── Symptoms ── */}
      {result.symptoms && !isHealthy && (
        <div className="bg-white/4 rounded-xl px-3.5 py-3 border border-white/8">
          <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wide mb-1">Observed Symptoms</p>
          <p className="text-xs text-gray-200 leading-relaxed">{result.symptoms}</p>
        </div>
      )}

      {/* ── Smart alerts ── */}
      <SmartAlerts
        diseaseId={result.disease_id}
        spreadRisk={result.spread_risk ?? 0}
        weatherTriggers={result.weather_triggers ?? []}
      />

      {/* ── Treatment cards (only for diseased) ── */}
      {!isHealthy && <TreatmentCards result={result} />}

      {/* ── XAI section ── */}
      <XAISection reasons={result.xai_explanation ?? []} />
    </motion.div>
  )
}
