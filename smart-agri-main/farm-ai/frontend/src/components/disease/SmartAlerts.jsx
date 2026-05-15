import { motion } from 'framer-motion'
import { AlertTriangle, CloudRain, Thermometer, Droplets, Wind, Zap, Bug } from 'lucide-react'

const TRIGGER_META = {
  high_humidity:          { icon: Droplets,     msg: 'High humidity detected — fungal spread risk elevated.' },
  warm_temperature:       { icon: Thermometer,  msg: 'Warm temperatures favor rapid pathogen growth.' },
  cool_temperature:       { icon: Thermometer,  msg: 'Cool conditions accelerate late blight and downy mildew.' },
  rainfall:               { icon: CloudRain,    msg: 'Recent rainfall increases infection and spore dispersal risk.' },
  high_aphid_population:  { icon: Bug,          msg: 'High vector (aphid/whitefly) population — virus transmission risk elevated.' },
  flooding:               { icon: CloudRain,    msg: 'Waterlogging detected — bacterial disease risk critical.' },
  foggy_conditions:       { icon: Wind,         msg: 'Foggy mornings favor overnight spore germination.' },
  cool_humid_weather:     { icon: Droplets,     msg: 'Cool humid weather is prime condition for disease spread.' },
  drought_stress:         { icon: Zap,          msg: 'Drought stress weakens plant immunity — monitor closely.' },
  warm_dry_weather:       { icon: Thermometer,  msg: 'Warm dry conditions favor powdery mildew spread.' },
  leaf_wetness:           { icon: Droplets,     msg: 'Prolonged leaf wetness accelerates fungal infection.' },
  poor_ventilation:       { icon: Wind,         msg: 'Poor air circulation promotes disease development.' },
  default:                { icon: AlertTriangle, msg: 'Environmental conditions favor disease progression.' },
}

export default function SmartAlerts({ diseaseId, spreadRisk = 0, weatherTriggers = [] }) {
  if (diseaseId === 'healthy' || (spreadRisk === 0 && weatherTriggers.length === 0)) return null

  const alerts = []

  if (spreadRisk >= 8) {
    alerts.push({
      id: '__critical',
      Icon: AlertTriangle,
      msg: `Disease spread risk ${spreadRisk}/10 — Immediate treatment required!`,
      level: 'critical',
    })
  } else if (spreadRisk >= 6) {
    alerts.push({
      id: '__high',
      Icon: AlertTriangle,
      msg: `Disease spread risk ${spreadRisk}/10 — Treatment recommended within 48 hours.`,
      level: 'high',
    })
  }

  weatherTriggers.slice(0, 3).forEach(trigger => {
    const meta = TRIGGER_META[trigger] || TRIGGER_META.default
    alerts.push({
      id: trigger,
      Icon: meta.icon,
      msg: `⚠ ${meta.msg}`,
      level: spreadRisk >= 7 ? 'high' : 'medium',
    })
  })

  if (alerts.length === 0) return null

  const STYLES = {
    critical: {
      border: 'border-red-500/50',
      bg: 'bg-red-500/10',
      text: 'text-red-300',
      glow: '0 0 14px rgba(239,68,68,0.25)',
    },
    high: {
      border: 'border-orange-500/40',
      bg: 'bg-orange-500/10',
      text: 'text-orange-300',
      glow: '0 0 10px rgba(249,115,22,0.2)',
    },
    medium: {
      border: 'border-yellow-500/35',
      bg: 'bg-yellow-500/8',
      text: 'text-yellow-300',
      glow: 'none',
    },
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
        <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
        Smart Alerts
      </p>
      {alerts.map((alert, i) => {
        const s = STYLES[alert.level]
        const Icon = alert.Icon
        return (
          <motion.div
            key={alert.id}
            initial={{ x: -12, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.09 }}
            className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl border text-xs ${s.border} ${s.bg} ${s.text}`}
            style={{ boxShadow: s.glow }}
          >
            <Icon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{alert.msg}</span>
          </motion.div>
        )
      })}
    </div>
  )
}
