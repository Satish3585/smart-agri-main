import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { commerceService } from '../../services/commerceService'

const CROP_OPTIONS = [
  'Tomato', 'Chili', 'Onion', 'Potato', 'Rice', 'Wheat', 'Maize',
  'Brinjal', 'Cabbage', 'Soybean', 'Groundnut', 'Cotton', 'Sugarcane',
  'Banana', 'Mango', 'Watermelon', 'Turmeric', 'Ginger', 'Pomegranate',
]

export default function ListingForm({ onSuccess, onClose }) {
  const [form, setForm] = useState({
    crop_name: 'Tomato', quantity_kg: '', price_per_kg: '',
    description: '', location: '', harvest_date: '', organic: false,
  })
  const [loading, setLoading] = useState(false)

  const handleChange = e => {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.quantity_kg || !form.price_per_kg || !form.location) {
      toast.error('Fill in quantity, price, and location')
      return
    }
    setLoading(true)
    try {
      await commerceService.createListing({
        ...form,
        quantity_kg: parseFloat(form.quantity_kg),
        price_per_kg: parseFloat(form.price_per_kg),
      })
      toast.success('Listing created! Buyers can now see your produce.')
      onSuccess?.()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-dark rounded-2xl p-6 w-full max-w-lg border border-emerald-500/20 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold text-white text-lg">Create New Listing</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Crop</label>
            <select name="crop_name" value={form.crop_name} onChange={handleChange} className="input-field">
              {CROP_OPTIONS.map(c => <option key={c} value={c} className="bg-navy-900">{c}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Quantity (kg)</label>
              <input type="number" name="quantity_kg" value={form.quantity_kg} onChange={handleChange}
                placeholder="500" min="1" className="input-field" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Price/kg (₹)</label>
              <input type="number" name="price_per_kg" value={form.price_per_kg} onChange={handleChange}
                placeholder="25.50" min="0.01" step="0.01" className="input-field" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Location</label>
            <input type="text" name="location" value={form.location} onChange={handleChange}
              placeholder="Village, District, State" className="input-field" />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Harvest Date (optional)</label>
            <input type="date" name="harvest_date" value={form.harvest_date} onChange={handleChange}
              className="input-field" />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Description (optional)</label>
            <textarea name="description" value={form.description} onChange={handleChange}
              rows={2} placeholder="Quality notes, variety, certification..."
              className="input-field resize-none" />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="organic" checked={form.organic} onChange={handleChange}
              className="w-4 h-4 accent-emerald-500" />
            <span className="text-sm text-gray-300">Organic certified produce</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Plus className="w-4 h-4" /> Create Listing</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
