'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import { FavoriteProvider } from '@/contexts/FavoriteContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <FavoriteProvider>
        {children}
      </FavoriteProvider>
    </AuthProvider>
  )
}