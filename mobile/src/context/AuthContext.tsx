import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { storage } from '@/lib/storage'
import { api } from '@/lib/api'

interface AuthState {
  token: string | null
  user: { id: string; email: string } | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, entityId?: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  token: null, user: null, isLoading: true,
  login: async () => {}, register: async () => {}, logout: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthState['user']>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    storage.getToken()
      .then(t => { setToken(t); setIsLoading(false) })
      .catch(() => { setIsLoading(false) })
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.auth.login(email, password)
    await storage.setToken(res.token)
    setToken(res.token)
    setUser(res.user)
  }, [])

  const register = useCallback(async (email: string, password: string, entityId?: string) => {
    const res = await api.auth.register(email, password, entityId)
    await storage.setToken(res.token)
    setToken(res.token)
    setUser(res.user)
  }, [])

  const logout = useCallback(async () => {
    await storage.clearToken()
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ token, user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
