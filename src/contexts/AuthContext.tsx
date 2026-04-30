'use client'

import { createContext, useCallback, useEffect, useState } from 'react'
import { fetchWithAuth } from "@/lib/fetchWithAuth"

export const AuthContext = createContext<any>(null)

/** รองรับหลายรูปแบบ JSON จาก /api/me (admin อาจเปลี่ยนโครงสร้าง) */
function userFromMePayload(data: unknown): any | null {
  if (!data || typeof data !== "object") return null
  const d = data as Record<string, unknown>
  if (d.user && typeof d.user === "object") return d.user
  const inner = d.data
  if (inner && typeof inner === "object") {
    const io = inner as Record<string, unknown>
    if (io.user && typeof io.user === "object") return io.user
    if ("id" in io && ("phone" in io || "role" in io || "email" in io)) return inner
  }
  for (const key of ["member", "profile", "account"]) {
    const v = d[key]
    if (v && typeof v === "object" && "id" in (v as object)) return v
  }
  if ("id" in d && ("phone" in d || "role" in d || "email" in d)) return d
  return null
}

export function AuthProvider({ children }: any) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("token")

    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }

    try {
      const base =
        process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
        "https://admin.thepaseo.co.th/api"
      const res = await fetchWithAuth(`${base}/me`)

      if (res.ok) {
        const data = await res.json()
        const u = userFromMePayload(data)
        if (u) {
          setUser(u)
          localStorage.setItem("user", JSON.stringify(u))
        } else {
          setUser(null)
        }
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem("token")
    const cachedUser = localStorage.getItem("user")

    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser))
      } catch {
        /* ignore */
      }
    }

    // มี token ต้องรอ refreshUser จบก่อนค่อย loading=false — กัน home-client เด้ง login ระหว่างรอ /me
    if (!token) {
      setLoading(false)
    }

    void refreshUser()
  }, [refreshUser])

  return (
    <AuthContext.Provider value={{ user, loading, setUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}