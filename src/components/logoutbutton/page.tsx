'use client'

import { useContext } from "react"
import { useRouter } from "next/navigation"
import { MdLogout } from "react-icons/md";
import { AuthContext } from "@/contexts/AuthContext"

export default function LogoutButton() {
  const router = useRouter()
  const { refreshUser } = useContext(AuthContext)

  const handleLogout = async () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    await refreshUser()
    router.push("/auth/login")
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center justify-center gap-2 bg-gray-300 rounded-full shadow-sm py-2 text-sm text-black"
    >
      <MdLogout size={24} />
      ออกจากระบบ
    </button>
  )
}