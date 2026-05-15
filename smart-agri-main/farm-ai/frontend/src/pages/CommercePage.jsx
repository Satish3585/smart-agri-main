import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ShoppingCart, Plus, Package, Filter, Search } from 'lucide-react'
import Navbar from '../components/common/Navbar'
import Sidebar from '../components/common/Sidebar'
import ProductCard from '../components/commerce/ProductCard'
import ListingForm from '../components/commerce/ListingForm'
import LoadingSpinner from '../components/common/LoadingSpinner'
import VoiceAssistant from '../components/common/VoiceAssistant'
import { useAuth } from '../context/AuthContext'
import { commerceService } from '../services/commerceService'

export default function CommercePage() {
  const { user } = useAuth()
  const [listings, setListings] = useState([])
  const [myOrders, setMyOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('browse')
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [organicFilter, setOrganicFilter] = useState(null)

  const loadListings = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.crop_name = search
      if (organicFilter !== null) params.organic = organicFilter
      const data = await commerceService.getListings(params)
      setListings(data.listings || [])
    } catch {}
    finally { setLoading(false) }
  }, [search, organicFilter])

  const loadOrders = useCallback(async () => {
    try {
      const data = await commerceService.getMyOrders()
      setMyOrders(data)
    } catch {}
  }, [])

  useEffect(() => { loadListings() }, [loadListings])
  useEffect(() => { if (tab === 'orders') loadOrders() }, [tab, loadOrders])

  return (
    <div className="min-h-screen">
      <Navbar />
      <Sidebar user={user} />
      <main className="lg:pl-64 pt-16">
        <div className="p-6 max-w-7xl">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h1 className="page-title">Farmer Marketplace</h1>
                  <p className="text-gray-400 text-sm">Direct farmer-to-buyer. No middlemen.</p>
                </div>
              </div>
              {user?.role === 'farmer' && (
                <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 py-2.5 px-5 text-sm">
                  <Plus className="w-4 h-4" /> Post Listing
                </button>
              )}
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-1 mb-5 glass-card p-1 rounded-2xl w-fit">
            {[
              { id: 'browse', label: 'Browse Crops', icon: ShoppingCart },
              { id: 'orders', label: `My Orders (${myOrders.length})`, icon: Package },
            ].map(t => {
              const Icon = t.icon
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === t.id ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-gray-400 hover:text-white'}`}>
                  <Icon className="w-4 h-4" /> {t.label}
                </button>
              )
            })}
          </div>

          {tab === 'browse' && (
            <>
              {/* Filters */}
              <div className="flex flex-wrap gap-3 mb-5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search crop..." className="input-field pl-9 w-48 text-sm py-2"
                  />
                </div>
                <button
                  onClick={() => setOrganicFilter(organicFilter === true ? null : true)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition-all ${organicFilter === true ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'glass text-gray-400 hover:text-white'}`}
                >
                  <Filter className="w-3.5 h-3.5" /> Organic Only
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
              ) : listings.length === 0 ? (
                <div className="glass-card p-16 text-center border border-white/10">
                  <ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No listings available. Be the first to post!</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {listings.map(listing => (
                    <ProductCard key={listing.id} listing={listing} onOrderPlaced={loadListings} />
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'orders' && (
            <div className="space-y-3">
              {myOrders.length === 0 ? (
                <div className="glass-card p-12 text-center border border-white/10">
                  <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No orders yet</p>
                </div>
              ) : myOrders.map(o => (
                <motion.div key={o.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="glass-card p-4 border border-white/10 flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold text-white capitalize">{o.crop_name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{o.quantity_kg} kg · ₹{o.total_price?.toLocaleString()}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {o.buyer_id === user?.id ? `From: ${o.seller_name}` : `To: ${o.buyer_name}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${
                      o.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                      o.status === 'pending' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' :
                      'bg-gray-500/15 text-gray-400 border-gray-500/30'
                    }`}>{o.status}</span>
                    <div className="text-xs text-gray-500 mt-1">{new Date(o.created_at).toLocaleDateString('en-IN')}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showForm && <ListingForm onSuccess={() => { setShowForm(false); loadListings() }} onClose={() => setShowForm(false)} />}
      <VoiceAssistant />
    </div>
  )
}
