'use client'

import { useRouter } from "next/navigation"
import { MdLogout } from "react-icons/md";

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
      className="w-full flex items-center justify-center gap-2 bg-gray-300 rounded-full shadow-sm py-2 text-sm text-black"
    >
      <MdLogout size={24} />
      ออกจากระบบ
    </button>
  )
}