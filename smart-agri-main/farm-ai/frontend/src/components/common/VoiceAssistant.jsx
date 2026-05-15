import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Volume2, X, Globe } from 'lucide-react'
import toast from 'react-hot-toast'

const LANGUAGES = [
  { code: 'en-IN', label: 'English', flag: '🇮🇳' },
  { code: 'kn-IN', label: 'ಕನ್ನಡ', flag: '🌿' },
  { code: 'hi-IN', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'mr-IN', label: 'मराठी', flag: '🌾' },
]

export default function VoiceAssistant() {
  const [open, setOpen] = useState(false)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [language, setLanguage] = useState('en-IN')
  const recognitionRef = useRef(null)

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Speech recognition not supported in this browser')
      return
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = language
    recognition.continuous = false
    recognition.interimResults = true
    recognition.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join('')
      setTranscript(t)
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = () => { setListening(false); toast.error('Could not capture voice') }
    recognition.start()
    recognitionRef.current = recognition
    setListening(true)
    setTranscript('')
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setListening(false)
  }

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = language
      utterance.rate = 0.9
      window.speechSynthesis.speak(utterance)
    }
  }

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-emerald-500
                   flex items-center justify-center shadow-glow-lg hover:shadow-[0_0_40px_rgba(16,185,129,0.7)]
                   transition-all duration-300 hover:scale-110"
        whileTap={{ scale: 0.9 }}
        animate={{ boxShadow: listening ? '0 0 40px rgba(16,185,129,0.8)' : undefined }}
      >
        <Mic className="w-6 h-6 text-white" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-6 z-50 w-80 glass-dark rounded-2xl p-5 shadow-card border border-emerald-500/20"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-white text-sm">Voice Assistant</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Language selector */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {LANGUAGES.map(l => (
                <button
                  key={l.code}
                  onClick={() => setLanguage(l.code)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    language === l.code
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20'
                  }`}
                >
                  {l.flag} {l.label}
                </button>
              ))}
            </div>

            {/* Transcript */}
            <div className="min-h-[60px] bg-white/5 rounded-xl p-3 mb-4 border border-white/10">
              {transcript ? (
                <p className="text-sm text-white">{transcript}</p>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  {listening ? 'Listening...' : 'Press mic to speak'}
                </p>
              )}
            </div>

            {/* Controls */}
            <div className="flex gap-3">
              <motion.button
                onClick={listening ? stopListening : startListening}
                whileTap={{ scale: 0.9 }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
                  listening
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                }`}
              >
                {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {listening ? 'Stop' : 'Speak'}
              </motion.button>
              {transcript && (
                <button
                  onClick={() => speak(transcript)}
                  className="px-4 py-3 rounded-xl bg-white/5 text-gray-400 border border-white/10 hover:border-emerald-500/40 hover:text-emerald-400 transition-all"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
