// app/auth/callback/line-liff/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function LineLiffCallback() {
  const router = useRouter()
  const { status } = useSession()

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/') // หรือ dashboard
    }
  }, [status, router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
      <p className="text-lg font-medium">กำลังเข้าสู่ระบบด้วย LINE...</p>
    </div>
  )
}