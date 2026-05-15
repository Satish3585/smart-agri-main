import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Brain, ChevronDown, Sparkles } from 'lucide-react'

export default function AIExplanationCard({ reasons = [], geminiExplanation = null, title = 'AI Reasoning' }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="glass-card p-4 border-emerald-500/20">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <Brain className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="font-semibold text-emerald-400 text-sm">{title}</span>
          <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
            XAI
          </span>
        </div>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-2">
              {reasons.map((reason, i) => (
                <motion.div
                  key={i}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-2 text-sm text-gray-300"
                >
                  <span className="text-emerald-500 mt-0.5 flex-shrink-0">▸</span>
                  <span>{reason}</span>
                </motion.div>
              ))}

              {geminiExplanation && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-3 p-3 bg-gold-500/10 border border-gold-500/20 rounded-xl"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                    <span className="text-xs font-semibold text-gold-400">Gemini AI Explanation</span>
                  </div>
                  <p className="text-xs text-gray-300 whitespace-pre-line leading-relaxed">
                    {geminiExplanation}
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
