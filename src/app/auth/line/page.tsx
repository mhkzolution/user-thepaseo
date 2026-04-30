"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import liff from "@line/liff"
import { Capacitor } from "@capacitor/core"

export default function LineCallback() {

  const router = useRouter()

  useEffect(() => {

    async function init() {

      const params = new URLSearchParams(window.location.search)
      const token = params.get("token")

      // 🔥 OAuth login
      if (token) {

        const isCapacitor = Capacitor.isNativePlatform()

        if (isCapacitor) {

          // ส่ง token กลับ app
          window.location.href = `user.thepaseo://login?token=${token}`

        } else {

          localStorage.setItem("token", token)

          setTimeout(() => {
            window.location.href = "/"
          }, 100)

        }

        return
      }

      try {

        await liff.init({
          liffId: process.env.NEXT_PUBLIC_LINE_LIFF_ID!
        })

        if (!liff.isLoggedIn()) {
          liff.login()
          return
        }

        const idToken = liff.getIDToken()

        if (!idToken) {
          liff.login()
          return
        }

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/line`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ idToken })
          }
        )

        const data = await res.json()

        if (data.token) {

          const isCapacitor = Capacitor.isNativePlatform()

          if (isCapacitor) {

            window.location.href = `user.thepaseo://login?token=${data.token}`

          } else {

            localStorage.setItem("token", data.token)

            setTimeout(() => {
              window.location.href = "/"
            }, 100)

          }

        }

      } catch (err) {
        console.error("LIFF login error", err)
        router.replace("/auth/login")
      }

    }

    init()

  }, [])

  return (
    <div className="flex flex-col items-center justify-center h-screen p-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-gray-200 rounded-full border-t-4 border-paseo animate-spin"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <span className="text-sm font-semibold text-paseo-hover">
            <svg
              className="w-8 h-8 animate-pulse"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="#9DC93C"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </span>
        </div>
      </div>
      <div className="text-gray-600 mt-4 text-center text-sm">กำลังเข้าสู่ระบบ...</div>
    </div>
  )
}