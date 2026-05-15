import { useRef, useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, CameraOff, X, FlipHorizontal, Aperture } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CameraScanner({ onCapture, onClose }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const [streaming, setStreaming] = useState(false)
  const [facingMode, setFacingMode] = useState('environment')
  const [capturing, setCapturing] = useState(false)

  const startCamera = useCallback(async (mode = facingMode) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setStreaming(true)
      }
    } catch {
      toast.error('Camera access denied. Allow camera permission in browser settings.')
    }
  }, [facingMode])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setStreaming(false)
  }, [])

  const capture = useCallback(async () => {
    if (!canvasRef.current || !videoRef.current || capturing) return
    setCapturing(true)
    await new Promise(r => setTimeout(r, 120))
    const canvas = canvasRef.current
    const video = videoRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob(blob => {
      if (blob) {
        const file = new File([blob], 'camera_capture.jpg', { type: 'image/jpeg' })
        onCapture(file, URL.createObjectURL(blob))
        stopCamera()
        onClose()
      }
      setCapturing(false)
    }, 'image/jpeg', 0.92)
  }, [capturing, onCapture, stopCamera, onClose])

  const flipCamera = useCallback(() => {
    const next = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(next)
    startCamera(next)
  }, [facingMode, startCamera])

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.92, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 24 }}
        className="w-full max-w-lg"
      >
        <div className="relative rounded-2xl overflow-hidden border border-emerald-500/40 bg-black"
          style={{ boxShadow: '0 0 40px rgba(16,185,129,0.2)' }}>

          {/* Header bar */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3
                          bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-2">
              <motion.div
                className="w-2.5 h-2.5 rounded-full bg-red-500"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <span className="text-white text-sm font-semibold tracking-wide">LIVE CAMERA</span>
            </div>
            <button
              onClick={() => { stopCamera(); onClose() }}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/25 transition-all"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Video viewport */}
          <div className="relative" style={{ aspectRatio: '16/9' }}>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Scan overlay — shown when streaming */}
            {streaming && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Corner brackets */}
                {[
                  'top-3 left-3 border-t-2 border-l-2 rounded-tl-lg',
                  'top-3 right-3 border-t-2 border-r-2 rounded-tr-lg',
                  'bottom-3 left-3 border-b-2 border-l-2 rounded-bl-lg',
                  'bottom-3 right-3 border-b-2 border-r-2 rounded-br-lg',
                ].map((cls, i) => (
                  <div key={i} className={`absolute w-8 h-8 border-emerald-400 ${cls}`} />
                ))}
                {/* Scanning line */}
                <motion.div
                  className="absolute left-3 right-3 h-px"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, #10b981 30%, #34d399 50%, #10b981 70%, transparent 100%)',
                    boxShadow: '0 0 12px 2px rgba(16,185,129,0.6)',
                  }}
                  animate={{ top: ['12%', '88%', '12%'] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
                />
                {/* Center reticle */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full border border-emerald-500/30 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-400/60" />
                  </div>
                </div>
                {/* Grid overlay */}
                <div className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: 'linear-gradient(rgba(16,185,129,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.4) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                  }}
                />
              </div>
            )}

            {/* Capture flash */}
            <AnimatePresence>
              {capturing && (
                <motion.div
                  initial={{ opacity: 0.8 }}
                  animate={{ opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 bg-white"
                />
              )}
            </AnimatePresence>

            {!streaming && (
              <div className="absolute inset-0 bg-navy-900 flex flex-col items-center justify-center">
                <CameraOff className="w-14 h-14 text-gray-600 mb-3" />
                <p className="text-gray-400 text-sm">Starting camera…</p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 px-4 py-4 bg-navy-900/90">
            <button
              onClick={flipCamera}
              className="w-12 h-12 rounded-full bg-white/10 border border-white/15 flex items-center justify-center
                         hover:bg-white/20 hover:border-emerald-500/40 transition-all"
            >
              <FlipHorizontal className="w-5 h-5 text-white" />
            </button>

            <motion.button
              onClick={capture}
              disabled={!streaming || capturing}
              whileTap={{ scale: 0.94 }}
              className="flex-1 py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2
                         disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{ background: 'linear-gradient(135deg, #10b981, #065f46)', boxShadow: '0 0 20px rgba(16,185,129,0.35)' }}
            >
              <Aperture className="w-5 h-5" />
              {capturing ? 'Capturing…' : 'Capture & Analyze'}
            </motion.button>

            <button
              onClick={() => { stopCamera(); onClose() }}
              className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center
                         hover:bg-red-500/30 transition-all"
            >
              <X className="w-5 h-5 text-red-400" />
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-3">
          Position leaf clearly · Ensure good lighting · Capture close-up for best AI accuracy
        </p>
      </motion.div>
    </motion.div>
  )
}
