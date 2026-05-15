import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, Loader2, Camera, Microscope, Cpu } from 'lucide-react'
import toast from 'react-hot-toast'
import { diseaseService } from '../../services/diseaseService'
import DiseaseResult from './DiseaseResult'
import CameraScanner from './CameraScanner'

const CROP_TYPES = [
  'tomato', 'potato', 'rice', 'wheat', 'chili', 'onion',
  'maize', 'cotton', 'banana', 'mango', 'sugarcane',
]

const SCAN_STEPS = [
  { label: 'Loading image…',            delay: 0    },
  { label: 'Extracting color features…', delay: 600  },
  { label: 'Running CNN analysis…',      delay: 1400 },
  { label: 'Matching disease patterns…', delay: 2400 },
  { label: 'Generating XAI report…',     delay: 3200 },
]

export default function DiseaseUpload() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [cropType, setCropType] = useState('tomato')
  const [loading, setLoading] = useState(false)
  const [scanStep, setScanStep] = useState(0)
  const [result, setResult] = useState(null)
  const [showCamera, setShowCamera] = useState(false)

  const onDrop = useCallback(accepted => {
    const f = accepted[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
  })

  const handleCameraCapture = (capturedFile, capturedPreview) => {
    setFile(capturedFile)
    setPreview(capturedPreview)
    setResult(null)
  }

  const handleDetect = async () => {
    if (!file) { toast.error('Please upload or capture a leaf/crop image'); return }
    setLoading(true)
    setScanStep(0)

    // Animate scan steps
    SCAN_STEPS.forEach(({ delay }, i) => {
      setTimeout(() => setScanStep(i), delay)
    })

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('crop_type', cropType)
      const data = await diseaseService.detect(formData)
      setResult(data)
      toast.success('Disease analysis complete!')
    } catch (err) {
      toast.error(err.message || 'Detection failed. Please try again.')
    } finally {
      setLoading(false)
      setScanStep(0)
    }
  }

  const reset = () => { setFile(null); setPreview(null); setResult(null) }

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5 border border-orange-500/20"
      >
        {/* Title */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center">
            <Microscope className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm">Upload Crop Image</h2>
            <p className="text-[11px] text-gray-500">AI will detect disease instantly</p>
          </div>
        </div>

        {/* Crop type selector */}
        <div className="mb-4">
          <label className="text-[11px] text-gray-400 mb-2 block font-medium uppercase tracking-wide">
            Select Crop Type
          </label>
          <div className="flex flex-wrap gap-1.5">
            {CROP_TYPES.map(c => (
              <button
                key={c}
                onClick={() => setCropType(c)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                  cropType === c
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20 hover:text-gray-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Upload area or preview */}
        {!preview ? (
          <div className="space-y-2">
            {/* Drag-drop zone */}
            <div
              {...getRootProps()}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragActive
                  ? 'border-orange-500/70 bg-orange-500/8'
                  : 'border-white/15 hover:border-orange-500/40 hover:bg-white/3'
              }`}
            >
              <input {...getInputProps()} />
              {isDragActive ? (
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="flex flex-col items-center"
                >
                  <Upload className="w-10 h-10 text-orange-400 mb-2 animate-bounce" />
                  <p className="text-orange-400 font-semibold">Drop image here</p>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-3">
                    <Upload className="w-7 h-7 text-orange-400" />
                  </div>
                  <p className="text-white font-semibold text-sm">Drop leaf/crop image here</p>
                  <p className="text-gray-500 text-xs mt-1">or click to browse</p>
                  <p className="text-xs text-gray-600 mt-2">JPG · PNG · WebP · Max 10MB</p>
                </div>
              )}
            </div>

            {/* Camera scan button */}
            <button
              onClick={() => setShowCamera(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/8
                         text-emerald-400 text-sm font-semibold hover:bg-emerald-500/15 hover:border-emerald-500/50 transition-all"
            >
              <Camera className="w-4 h-4" />
              Scan with Camera
            </button>
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden bg-black/20">
            <img
              src={preview}
              alt="Crop"
              className="w-full max-h-64 object-contain rounded-xl"
            />

            {/* Scanning overlay while loading */}
            {loading && (
              <div className="absolute inset-0 rounded-xl overflow-hidden">
                <div className="absolute inset-0 bg-black/50" />
                {/* Scan line */}
                <motion.div
                  className="absolute left-0 right-0 h-0.5"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, #10b981 20%, #34d399 50%, #10b981 80%, transparent 100%)',
                    boxShadow: '0 0 16px 3px rgba(16,185,129,0.7)',
                  }}
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                />
                {/* Grid */}
                <div
                  className="absolute inset-0 opacity-15"
                  style={{
                    backgroundImage: 'linear-gradient(rgba(16,185,129,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.5) 1px, transparent 1px)',
                    backgroundSize: '28px 28px',
                  }}
                />
                {/* Status text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <div className="flex items-center gap-2 bg-black/60 px-4 py-2 rounded-xl border border-emerald-500/30">
                    <Cpu className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span className="text-emerald-400 text-xs font-bold tracking-wide">AI SCANNING…</span>
                  </div>
                  <motion.p
                    key={scanStep}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-emerald-300/80 text-[11px] bg-black/50 px-3 py-1 rounded-lg"
                  >
                    {SCAN_STEPS[scanStep]?.label}
                  </motion.p>
                </div>
              </div>
            )}

            {/* Remove button */}
            {!loading && (
              <button
                onClick={reset}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500/80 text-white
                           flex items-center justify-center hover:bg-red-500 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Detect button */}
        <motion.button
          onClick={handleDetect}
          disabled={!file || loading}
          whileTap={{ scale: 0.97 }}
          className="w-full mt-4 py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2
                     disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          style={{
            background: loading
              ? 'linear-gradient(135deg, #065f46, #047857)'
              : 'linear-gradient(135deg, #f97316, #ea580c)',
            boxShadow: loading ? 'none' : '0 0 20px rgba(249,115,22,0.35)',
          }}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing Disease…
            </>
          ) : (
            <>
              <Microscope className="w-4 h-4" />
              Detect Disease with AI
            </>
          )}
        </motion.button>
      </motion.div>

      {/* Results */}
      <AnimatePresence>
        {result && <DiseaseResult result={result} cropImage={preview} />}
      </AnimatePresence>

      {/* Camera scanner modal */}
      <AnimatePresence>
        {showCamera && (
          <CameraScanner
            onCapture={handleCameraCapture}
            onClose={() => setShowCamera(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
