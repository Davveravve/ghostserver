'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useAuth, User } from '@/hooks/useAuth'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  souls: number | null
  login: () => void
  logout: () => Promise<void>
  refresh: () => Promise<void>
  updateSouls: (newSouls: number) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
