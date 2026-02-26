'use client'

import { useRouter } from "next/navigation"

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/auth/login")
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center justify-center gap-2 bg-gray-300 rounded-xl shadow-sm py-3 text-black"
    >
      ออกจากระบบ
    </button>
  )
}