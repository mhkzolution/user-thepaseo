'use client'

import { useState } from "react"

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1)
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleSendOtp = async () => {
    setError("")
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ phone }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || "เกิดข้อผิดพลาด")
    } else {
      setStep(2)
    }
  }

  const handleResetPassword = async () => {
    setError("")
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ phone, otp, newPassword }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || "เกิดข้อผิดพลาด")
    } else {
      setSuccess("เปลี่ยนรหัสผ่านสำเร็จแล้ว!")
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-4 border rounded shadow">
      <h2 className="text-xl font-bold mb-4">ลืมรหัสผ่าน</h2>

      {step === 1 && (
        <>
          <label>เบอร์โทรศัพท์</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border p-2 mb-2"
          />
          <button
            onClick={handleSendOtp}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            ส่ง OTP
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <label>รหัส OTP</label>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full border p-2 mb-2"
          />

          <label>รหัสผ่านใหม่</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border p-2 mb-2"
          />

          <button
            onClick={handleResetPassword}
            className="bg-paseo text-white px-4 py-2 rounded"
          >
            รีเซ็ตรหัสผ่าน
          </button>
        </>
      )}

      {error && <p className="text-red-500 mt-2">{error}</p>}
      {success && <p className="text-paseo mt-2">{success}</p>}
    </div>
  )
}
