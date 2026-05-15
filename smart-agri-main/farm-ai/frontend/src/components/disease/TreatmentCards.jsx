import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FlaskConical, Leaf, Droplets, Sprout, Shield, ListChecks } from 'lucide-react'

const TABS = [
  { id: 'steps',    label: 'Treatment',  Icon: ListChecks,   color: 'text-blue-400',    ring: 'border-blue-500/35',    bg: 'bg-blue-500/12'    },
  { id: 'organic',  label: 'Organic',    Icon: Leaf,         color: 'text-emerald-400', ring: 'border-emerald-500/35', bg: 'bg-emerald-500/12' },
  { id: 'chemical', label: 'Chemical',   Icon: FlaskConical, color: 'text-purple-400',  ring: 'border-purple-500/35',  bg: 'bg-purple-500/12'  },
  { id: 'fert',     label: 'Fertilizer', Icon: Sprout,       color: 'text-lime-400',    ring: 'border-lime-500/35',    bg: 'bg-lime-500/12'    },
  { id: 'water',    label: 'Irrigation', Icon: Droplets,     color: 'text-cyan-400',    ring: 'border-cyan-500/35',    bg: 'bg-cyan-500/12'    },
  { id: 'prevent',  label: 'Prevention', Icon: Shield,       color: 'text-yellow-400',  ring: 'border-yellow-500/35',  bg: 'bg-yellow-500/12'  },
]

export default function TreatmentCards({ result }) {
  const [active, setActive] = useState('steps')

  const content = {
    steps:    result.treatment_steps         || [],
    organic:  result.organic_treatment       ? [result.organic_treatment]         : ['No specific organic treatment listed.'],
    chemical: result.chemical_treatment      ? [result.chemical_treatment]         : ['No specific chemical treatment listed.'],
    fert:     result.fertilizer_recommendation ? [result.fertilizer_recommendation] : ['Maintain standard crop fertilization schedule.'],
    water:    result.irrigation_advice        ? [result.irrigation_advice]          : ['Follow standard irrigation practices for your crop.'],
    prevent:  result.preventive_measures     || [],
  }

  const tab = TABS.find(t => t.id === active)

  return (
    <div>
      {/* Scrollable tab bar */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto no-scrollbar pb-1">
        {TABS.map(t => {
          const Icon = t.Icon
          return (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap
                          border transition-all flex-shrink-0 ${
                active === t.id
                  ? `${t.bg} ${t.color} ${t.ring}`
                  : 'bg-white/5 text-gray-500 border-white/10 hover:border-white/20 hover:text-gray-300'
              }`}
            >
              <Icon className="w-3 h-3" />
              {t.label}
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className={`rounded-xl border p-4 ${tab.ring} ${tab.bg}`}
        >
          <div className="flex items-center gap-2 mb-3">
            <tab.Icon className={`w-4 h-4 ${tab.color}`} />
            <h4 className={`text-sm font-bold ${tab.color}`}>{tab.label}</h4>
          </div>

          <ol className="space-y-2.5">
            {content[active].map((item, i) => (
              <motion.li
                key={i}
                initial={{ x: -8, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-start gap-2.5 text-xs text-gray-200 leading-relaxed"
              >
                {content[active].length > 1 && (
                  <span className={`w-5 h-5 rounded-full ${tab.bg} ${tab.color} border ${tab.ring}
                                    flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5`}>
                    {i + 1}
                  </span>
                )}
                <span>{item}</span>
              </motion.li>
            ))}
          </ol>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
