// app/layout-client.tsx
'use client'

import Navbar from '../components/navbar/page'
import { Providers } from './providers'
import { usePathname, useRouter } from 'next/navigation'
import DeepLinkHandler from "@/components/DeepLinkHandler"
import { useContext, useEffect } from 'react'
import { AuthContext } from '@/contexts/AuthContext'

function RequirePhoneGuard({ pathname }: { pathname: string }) {
  const router = useRouter()
  const { user, loading } = useContext(AuthContext)

  useEffect(() => {
    if (loading || !user) return

    const phone = typeof user.phone === "string" ? user.phone.trim() : ""

    if (!phone) {
      router.replace('/complete-profile')
    }
  }, [loading, user, pathname, router])

  return null
}

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()


  return (
    <Providers>
      <RequirePhoneGuard pathname={pathname} />
      <DeepLinkHandler />
      <Navbar />
      <main className="min-h-screen">{children}</main>
    </Providers>
  )
}
