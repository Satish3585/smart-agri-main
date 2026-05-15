import { useState } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, ShieldCheck, Loader2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.id = 'razorpay-script'
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function RazorpayCheckout({ listing, quantity, deliveryAddress, onSuccess, onClose }) {
  const [loading, setLoading] = useState(false)
  const [paid, setPaid] = useState(false)

  const totalPrice = parseFloat((listing.price_per_kg * quantity).toFixed(2))

  const handlePayment = async () => {
    if (!deliveryAddress?.trim()) {
      toast.error('Please enter a delivery address first')
      return
    }
    setLoading(true)

    const loaded = await loadRazorpayScript()
    if (!loaded) {
      toast.error('Failed to load Razorpay. Check your internet connection.')
      setLoading(false)
      return
    }

    let orderData
    try {
      orderData = await api.post('/payment/create-order', {
        listing_id: listing.id,
        quantity_kg: quantity,
        delivery_address: deliveryAddress,
      })
    } catch (err) {
      toast.error(err.message || 'Could not create payment order')
      setLoading(false)
      return
    }

    const options = {
      key: orderData.key_id,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'Farm AI',
      description: `${orderData.crop_name} — ${quantity} kg`,
      order_id: orderData.razorpay_order_id,
      prefill: {
        name: orderData.buyer_name,
        email: orderData.buyer_email,
      },
      theme: { color: '#10b981' },
      handler: async (response) => {
        try {
          const result = await api.post('/payment/verify', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            farm_ai_order_id: orderData.farm_order_id,
          })
          setPaid(true)
          toast.success('Payment successful! Order confirmed.')
          if (onSuccess) onSuccess(result)
        } catch (err) {
          toast.error('Payment verification failed. Contact support.')
        }
        setLoading(false)
      },
      modal: {
        ondismiss: () => {
          toast('Payment cancelled')
          setLoading(false)
        },
      },
    }

    const rzp = new window.Razorpay(options)
    rzp.on('payment.failed', (resp) => {
      toast.error(`Payment failed: ${resp.error.description}`)
      setLoading(false)
    })
    rzp.open()
  }

  if (paid) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Payment Successful!</h3>
        <p className="text-gray-400 text-sm">Your order has been confirmed. The farmer will be notified.</p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Order Summary */}
      <div className="glass-dark p-4 rounded-xl space-y-2">
        <h4 className="text-sm font-semibold text-gray-300 mb-3">Order Summary</h4>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">{listing.crop_name}</span>
          <span className="text-white">{quantity} kg</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Price per kg</span>
          <span className="text-white">₹{listing.price_per_kg}</span>
        </div>
        <div className="border-t border-white/10 pt-2 flex justify-between font-bold">
          <span className="text-white">Total</span>
          <span className="text-emerald-400 text-lg">₹{totalPrice.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Security note */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        <span>Secured by Razorpay — 256-bit SSL encryption</span>
      </div>

      {/* Pay button */}
      <button
        onClick={handlePayment}
        disabled={loading}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
        ) : (
          <><CreditCard className="w-4 h-4" /> Pay ₹{totalPrice.toLocaleString('en-IN')} with Razorpay</>
        )}
      </button>

      <button
        onClick={onClose}
        className="w-full text-center text-sm text-gray-500 hover:text-gray-300 transition-colors py-1"
      >
        Cancel
      </button>
    </div>
  )
}
