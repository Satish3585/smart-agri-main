import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Suspense, lazy } from 'react'
import ProtectedRoute from './components/common/ProtectedRoute'
import LoadingSpinner from './components/common/LoadingSpinner'

const LandingPage = lazy(() => import('./pages/LandingPage'))
const AuthPage = lazy(() => import('./pages/AuthPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const CropRecommendationPage = lazy(() => import('./pages/CropRecommendationPage'))
const MarketIntelligencePage = lazy(() => import('./pages/MarketIntelligencePage'))
const DiseaseDetectionPage = lazy(() => import('./pages/DiseaseDetectionPage'))
const WeatherPage = lazy(() => import('./pages/WeatherPage'))
const CommercePage = lazy(() => import('./pages/CommercePage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/crops" element={<ProtectedRoute><CropRecommendationPage /></ProtectedRoute>} />
          <Route path="/market" element={<ProtectedRoute><MarketIntelligencePage /></ProtectedRoute>} />
          <Route path="/disease" element={<ProtectedRoute><DiseaseDetectionPage /></ProtectedRoute>} />
          <Route path="/weather" element={<ProtectedRoute><WeatherPage /></ProtectedRoute>} />
          <Route path="/commerce" element={<ProtectedRoute><CommercePage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  )
}
