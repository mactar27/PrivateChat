'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import useSWR from 'swr'

export interface AuthUser {
  id: string
  username: string
  email: string
  avatar: string | null
  status: 'online' | 'offline' | 'away'
}

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  error: Error | null
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    if (res.status === 401) {
      return null
    }
    throw new Error('Failed to fetch user')
  }
  const data = await res.json()
  return data.user
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, error, isLoading, mutate } = useSWR<AuthUser | null>(
    '/api/auth/me',
    fetcher,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  )

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Login failed')
    }
    
    const data = await res.json()
    mutate(data.user)
  }, [mutate])

  const register = useCallback(async (username: string, email: string, password: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    })
    
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Registration failed')
    }
    
    const data = await res.json()
    mutate(data.user)
  }, [mutate])

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    mutate(null)
  }, [mutate])

  const refresh = useCallback(async () => {
    await mutate()
  }, [mutate])

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error: error ?? null,
        login,
        register,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
