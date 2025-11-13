// app/layout-client.tsx
'use client'

import Navbar from '../components/navbar/page'
import { Providers } from './providers'
import { usePathname } from 'next/navigation'

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // ✅ ซ่อน Navbar ในทุกหน้า Auth และ Admin
  const hideNavbar =
    pathname.startsWith('/welcome') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/complete-profile') ||
    pathname.startsWith('/admin')

  return (
    <Providers>
      {!hideNavbar && <Navbar />}
      <main className="min-h-screen">{children}</main>
    </Providers>
  )
}
