import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '../lib/api'

interface User {
  id: number
  username: string
  role: 'admin' | 'user'
  active: boolean
  email_verified: boolean
  google_email: string | null
  last_login: string | null
  created_at: string | null
}

interface SignupResult {
  needs_verification: boolean
  message: string
  demo_verify_url: string
  email: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  signup: (username: string, password: string, email: string, name?: string) => Promise<SignupResult>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/auth/me')
      .then((d: { user: User | null }) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (username: string, password: string) => {
    const data = await api.post('/auth/login', { username, password })
    setUser(data.user)
  }

  const logout = async () => {
    await api.post('/auth/logout', {})
    setUser(null)
  }

  const signup = async (username: string, password: string, email: string, name = ''): Promise<SignupResult> => {
    // Does NOT auto-login — returns verification info
    return api.post('/auth/signup', { username, password, email, name })
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, signup, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
