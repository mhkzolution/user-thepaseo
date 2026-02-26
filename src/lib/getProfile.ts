// lib/getProfile.ts
import { fetchWithAuth } from "@/lib/fetchWithAuth"

async function getProfile() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!
  const res = await fetchWithAuth(`${API_URL}/profile`, {
      credentials: "include",
    }
  )

  if (!res.ok) return null

  return await res.json()
}