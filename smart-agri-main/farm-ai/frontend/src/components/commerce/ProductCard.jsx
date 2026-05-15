import { motion } from 'framer-motion'
import { useState } from 'react'
import { MapPin, Package, Leaf, ShoppingCart, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import RazorpayCheckout from './RazorpayCheckout'

export default function ProductCard({ listing, onOrderPlaced }) {
  const { user } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [qty, setQty] = useState(1)
  const [address, setAddress] = useState('')

  const isOwn = listing.seller_id === user?.id

  const handleProceedToPayment = () => {
    if (!address.trim()) { toast.error('Enter delivery address'); return }
    if (qty < 1 || qty > listing.quantity_kg) { toast.error(`Enter 1–${listing.quantity_kg} kg`); return }
    setShowCheckout(true)
  }

  const handlePaymentSuccess = () => {
    setShowModal(false)
    setShowCheckout(false)
    onOrderPlaced?.()
  }

  return (
    <>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className="glass-card p-4 border border-white/10 flex flex-col"
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-white capitalize">{listing.crop_name}</h3>
            <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
              <MapPin className="w-3 h-3" /> {listing.location}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-emerald-400">₹{listing.price_per_kg}<span className="text-xs text-gray-400">/kg</span></div>
            {listing.organic && (
              <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 mt-1">
                <Leaf className="w-3 h-3" /> Organic
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
          <span className="flex items-center gap-1"><Package className="w-3 h-3" /> {listing.quantity_kg} kg available</span>
          {listing.harvest_date && <span>Harvested: {listing.harvest_date}</span>}
        </div>

        {listing.description && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{listing.description}</p>
        )}

        <div className="mt-auto flex items-center justify-between">
          <div className="text-xs text-gray-500">By {listing.seller_name}</div>
          {!isOwn && user?.role !== 'admin' && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-semibold hover:bg-emerald-500/30 transition-all"
            >
              <ShoppingCart className="w-3.5 h-3.5" /> Buy Now
            </button>
          )}
        </div>
      </motion.div>

      {/* Buy Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-dark rounded-2xl p-6 w-full max-w-sm border border-white/10"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white">
                {showCheckout ? 'Complete Payment' : 'Place Order'}
              </h3>
              <button onClick={() => { setShowModal(false); setShowCheckout(false) }}>
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {!showCheckout ? (
              <>
                <p className="text-sm text-gray-300 mb-4">
                  <span className="text-white font-semibold capitalize">{listing.crop_name}</span> @ ₹{listing.price_per_kg}/kg
                  {listing.seller_name && <span className="text-gray-500"> · {listing.seller_name}</span>}
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Quantity (kg) — Max {listing.quantity_kg} kg</label>
                    <input
                      type="number" min="1" max={listing.quantity_kg} value={qty}
                      onChange={e => setQty(Number(e.target.value))}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Delivery Address</label>
                    <textarea
                      value={address} onChange={e => setAddress(e.target.value)}
                      rows={2} placeholder="Village, Taluk, District, State"
                      className="input-field resize-none text-sm"
                    />
                  </div>
                  <div className="flex justify-between text-sm font-semibold text-white bg-white/5 rounded-xl p-3">
                    <span>Total</span>
                    <span className="text-emerald-400">₹{(qty * listing.price_per_kg).toLocaleString('en-IN')}</span>
                  </div>
                  <button onClick={handleProceedToPayment} className="btn-primary w-full flex items-center justify-center gap-2">
                    <ShoppingCart className="w-4 h-4" /> Proceed to Payment
                  </button>
                </div>
              </>
            ) : (
              <RazorpayCheckout
                listing={listing}
                quantity={qty}
                deliveryAddress={address}
                onSuccess={handlePaymentSuccess}
                onClose={() => setShowCheckout(false)}
              />
            )}
          </motion.div>
        </div>
      )}
    </>
  )
}
