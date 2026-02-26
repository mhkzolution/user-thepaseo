'use client'

import { createContext, useEffect, useState, useCallback } from 'react'
import { fetchWithAuth } from "@/lib/fetchWithAuth"

interface AuthContextType {
  user: any
  loading: boolean
  setUser: (user: any) => void
  refreshUser: () => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  refreshUser: async () => {},
  logout: () => {},
})

export function AuthProvider({ children }: any) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // 🔥 โหลด user จาก token
  const loadUser = useCallback(async () => {
    const token = localStorage.getItem("token")

    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }

    try {
      const res = await fetchWithAuth(`${API_URL}/me`)

      if (!res.ok) {
        localStorage.removeItem("token")
        setUser(null)
      } else {
        const data = await res.json()
        setUser(data.user)
      }
    } catch (err) {
      console.error("Load user failed:", err)
      setUser(null)
    }

    setLoading(false)
  }, [API_URL])

  // 🔥 โหลดครั้งแรกตอน mount
  useEffect(() => {
    loadUser()
  }, [loadUser])

  // 🔥 ให้ login เรียกตัวนี้แทน
  const refreshUser = async () => {
    setLoading(true)
    await loadUser()
  }

  // 🔥 logout กลาง
  const logout = () => {
    localStorage.removeItem("token")
    setUser(null)
    window.location.href = "/auth/login"
  }

  return (
    <AuthContext.Provider value={{ user, loading, setUser, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}