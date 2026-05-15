import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Sprout, TrendingUp, Bug, Cloud,
  ShoppingCart, Shield, User, ChevronRight
} from 'lucide-react'

const LINKS = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard',    color: 'text-emerald-400' },
  { to: '/crops',      icon: Sprout,          label: 'AI Crops',      color: 'text-lime-400' },
  { to: '/market',     icon: TrendingUp,      label: 'Market AI',     color: 'text-blue-400' },
  { to: '/disease',    icon: Bug,             label: 'Disease AI',    color: 'text-orange-400' },
  { to: '/weather',    icon: Cloud,           label: 'Weather',       color: 'text-sky-400' },
  { to: '/commerce',   icon: ShoppingCart,    label: 'Marketplace',   color: 'text-purple-400' },
  { to: '/admin',      icon: Shield,          label: 'Admin',         color: 'text-gold-400', adminOnly: true },
  { to: '/profile',    icon: User,            label: 'Profile',       color: 'text-gray-400' },
]

export default function Sidebar({ user }) {
  const location = useLocation()
  const filtered = LINKS.filter(l => !l.adminOnly || user?.role === 'admin')

  return (
    <motion.aside
      initial={{ x: -60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="hidden lg:flex flex-col w-64 min-h-screen fixed left-0 top-16 bottom-0
                 bg-navy-900/60 backdrop-blur-xl border-r border-white/8 py-6 px-3 z-40"
    >
      {filtered.map((link, i) => {
        const Icon = link.icon
        const active = location.pathname === link.to
        return (
          <motion.div
            key={link.to}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.05 * i }}
          >
            <Link
              to={link.to}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 group transition-all duration-200 ${
                active
                  ? 'bg-emerald-500/15 border border-emerald-500/30'
                  : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                active ? 'bg-emerald-500/20' : 'bg-white/5 group-hover:bg-white/10'
              }`}>
                <Icon className={`w-4 h-4 ${active ? link.color : 'text-gray-500 group-hover:text-gray-300'}`} />
              </div>
              <span className={`text-sm font-medium ${active ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>
                {link.label}
              </span>
              {active && <ChevronRight className="w-3.5 h-3.5 text-emerald-400 ml-auto" />}
            </Link>
          </motion.div>
        )
      })}

      {/* AI Badge at bottom */}
      <div className="mt-auto mx-2">
        <div className="glass p-3 text-center">
          <div className="text-xs text-emerald-400 font-semibold">Powered by</div>
          <div className="text-xs text-gradient font-bold mt-0.5">Explainable AI</div>
          <div className="text-[10px] text-gray-500 mt-1">Technology farmers trust</div>
        </div>
      </div>
    </motion.aside>
  )
}
