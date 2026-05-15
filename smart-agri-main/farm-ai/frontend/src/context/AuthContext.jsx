import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('farm_ai_token'))
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async () => {
    const storedToken = localStorage.getItem('farm_ai_token')
    if (!storedToken) { setLoading(false); return }
    try {
      const userData = await authService.getMe()
      setUser(userData)
    } catch {
      localStorage.removeItem('farm_ai_token')
      setToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadUser() }, [loadUser])

  const login = async (email, password) => {
    const data = await authService.login(email, password)
    localStorage.setItem('farm_ai_token', data.access_token)
    setToken(data.access_token)
    setUser(data.user)
    return data.user
  }

  const register = async (formData) => {
    const data = await authService.register(formData)
    localStorage.setItem('farm_ai_token', data.access_token)
    setToken(data.access_token)
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('farm_ai_token')
    setToken(null)
    setUser(null)
  }

  const updateUser = (updatedData) => {
    setUser(prev => ({ ...prev, ...updatedData }))
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
