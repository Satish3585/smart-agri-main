import { motion } from 'framer-motion'

export default function LoadingSpinner({ fullScreen = false, size = 'md', text = '' }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-10 h-10', lg: 'w-16 h-16' }

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        className={`${sizes[size]} rounded-full border-2 border-emerald-500/30 border-t-emerald-500`}
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        style={{ boxShadow: '0 0 15px rgba(16,185,129,0.4)' }}
      />
      {text && <p className="text-emerald-400/70 text-sm">{text}</p>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-navy-900 flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="text-3xl font-bold text-gradient mb-2">🌱 Farm AI</div>
          {spinner}
        </div>
      </div>
    )
  }
  return spinner
}
