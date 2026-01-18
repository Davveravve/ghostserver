'use client'

import { useState, useEffect, useCallback } from 'react'

export interface User {
  steamId: string
  name: string
  avatar: string
  profileUrl: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  souls: number | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    souls: null,
  })

  const fetchSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session')
      const data = await response.json()

      setState(prev => ({
        ...prev,
        user: data.user,
        isLoading: false,
        isAuthenticated: !!data.user,
      }))

      // Fetch souls if authenticated
      if (data.user) {
        fetchSouls()
      }
    } catch (error) {
      console.error('Failed to fetch session:', error)
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        souls: null,
      })
    }
  }, [])

  const fetchSouls = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setState(prev => ({ ...prev, souls: data.souls ?? 0 }))
      }
    } catch (error) {
      console.error('Failed to fetch souls:', error)
    }
  }, [])

  const updateSouls = useCallback((newSouls: number) => {
    setState(prev => ({ ...prev, souls: newSouls }))
  }, [])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  const login = useCallback(() => {
    window.location.href = '/api/auth/steam'
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        souls: null,
      })
      window.location.href = '/'
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }, [])

  return {
    ...state,
    login,
    logout,
    refresh: fetchSession,
    updateSouls,
  }
}
