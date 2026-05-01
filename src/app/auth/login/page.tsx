'use client'

import { useEffect, useState } from 'react'
import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import Image from 'next/image';
import { FaLine } from "react-icons/fa6";
import Link from 'next/link';
import OTPInputSimple from "@/components/ui/input-otp"
import { Button } from "@/components/ui/button"
import BannerLogin from "@/components/BannerLogin/page"
import Loading from '@/components/loading';

import { ArrowLeft } from "lucide-react"

function formatThaiPhone(phone: string) {
  const cleaned = phone.replace(/\D/g, "").slice(0, 10)

  if (cleaned.length <= 3) return cleaned
  if (cleaned.length <= 7) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`
  }
  return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`
}

export default function LoginPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!
  const { refreshUser } = useContext(AuthContext)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [otpError, setOtpError] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [token, setToken] = useState<string | null>(null)

  const handleLineLogin = () => {
    window.location.href = `${API_URL}/auth/line/start`
  }

useEffect(() => {
  import("@/lib/liff-client").then((module) => {
    module.initLiff().catch((err) => {
      console.log("LIFF Init Failed:", err);
    });
  });
}, []);

  // ฟังก์ชันเดิมสำหรับตรวจสอบเบอร์และรหัสผ่าน
  const handleCheckCredentials = async () => {
    setError('')
    if (!phone) {
      setError('กรุณากรอกเบอร์โทรและรหัสผ่าน')
      return false
    }

    setLoading(true)
    const res = await fetch(`${API_URL}/auth/check-credentials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'เกิดข้อผิดพลาด')
      return false
    }

    return true
  }

  // ฟังก์ชันเดิมสำหรับส่ง OTP
  const handleRequestOtp = async () => {
    if (countdown > 0) return

    setOtpError("")
    setOtpSent(false)

    const res = await fetch(`${API_URL}/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        purpose: "VERIFY_PHONE",
      }),
    })

    if (!res.ok) {
      let errorMessage = "ไม่สามารถส่ง OTP ได้"

      try {
        const data = await res.json()
        errorMessage = data?.error || errorMessage
      } catch {}

      setOtpError(errorMessage)
      return
    }

    // ✅ สำเร็จ
    setOtpSent(true)
    setCountdown(60)
  }

  // ฟังก์ชันใหม่สำหรับ Step 2 (ตรวจสอบเบอร์/รหัสผ่าน)
  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault()
    const isValid = await handleCheckCredentials()
    if (!isValid) return

    await handleRequestOtp()
    setStep(3) // ไปยัง Step 3
  }

  // ฟังก์ชันใหม่สำหรับ Step 3 (ยืนยัน OTP)
  const handleStep3 = async (e: React.FormEvent) => {
    e.preventDefault()
    setOtpError("")

    const res = await fetch(`${API_URL}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        otp,
        purpose: "VERIFY_PHONE",
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setOtpError(data?.error || "OTP ไม่ถูกต้อง")
      return
    }

    localStorage.setItem("token", data.token)
    await refreshUser()
    const params = new URLSearchParams(window.location.search)
    const next = params.get("next")?.trim() ?? ""
    const dest =
      next.startsWith("/") && !next.startsWith("//") && !next.includes(":")
        ? next
        : "/"
    // full navigation — หลีกเลี่ยง RSC soft-nav ที่อาจโดน cache / redirect ค้าง
    window.location.assign(dest)
  }

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [countdown])

  if (loading) {
    return (
      <Loading />
    );
  }

  return (
    <div className="max-w-lg mx-auto h-screen p-0 mb-0 md:mb-0 mb-0 rounded-t-xl relative overflow-hidden">

        <div className="fixed inset-x-0 top-0 overflow-hidden pt-2 pb-2 md:hidden z-50 blur2 rounded-b-xl shadow-sm border border-gray-200 flex flex-col">
          <div className="relative flex flex-row justify-center">

            <div className="flex flex-row justify-center gap-2 h-min">
              <Image
                src="/logo.png"
                alt="Thepaseo"
                width={40}
                height={40}
                unoptimized
              />
            </div>
    
          </div>
        </div>

        <div className="md:pt-4 pt-16 mb-0 py-4 px-4 md:px-4">
          <BannerLogin />
        </div>
        
        <div className="w-full h-full py-8 px-10 m-0 rounded-t-3xl bg-white shadow z-50 md:relative">

          {step > 1 && (
            <button
              onClick={() => {
                if (step === 3) setOtp("")
                setStep((prev) => (prev - 1) as any)
              }}
              disabled={loading}
              className="absolute top-6 left-10 w-8 h-8 flex items-center justify-center border rounded-full text-xs"
            >
              <ArrowLeft size={24} />
            </button>
          )}

          {/* --- Step 1: แสดงปุ่มเข้าสู่ระบบด้วย LINE และปุ่มสำหรับเบอร์โทรศัพท์ --- */}
          {step === 1 && (
            <>
              <div className="flex flex-col justify-center items-center space-y-6">

                <h2 className="text-lg font-semibold mb-5 text-center text-black">เข้าสู่ระบบ</h2>
                <button
                  onClick={handleLineLogin}
                  className="w-full text-white p-2 md:p-2 rounded-full flex justify-center items-center bg-paseo"
                  >
                  <FaLine className="h-6 w-6 text-white" />
                  <span className="flex-shrink mx-4 text-white">เข้าสู่ระบบด้วย LINE</span>
                </button>

                <button
                  onClick={() => setStep(2)}
                  className="w-full text-white p-2 md:p-2 rounded-full flex justify-center items-center bg-paseo"
                >
                  <span>เข้าสู่ระบบด้วยเบอร์โทรศัพท์</span>
                </button>
              </div>
            </>
          )}

          {/* --- Step 2: ให้กรอกเบอร์โทรและรหัสผ่าน --- */}
          {step === 2 && (
            <>
              <div className="w-full flex flex-col justify-center items-center space-y-6">

                <h2 className="text-lg font-semibold mb-5 text-center text-black">เข้าสู่ระบบด้วยเบอร์โทรศัพท์</h2>
                <form onSubmit={handleStep2} className="w-full space-y-6">
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="เบอร์โทรศัพท์"
                    className="w-full pt-2 pb-2 pl-4 pr-4 border rounded-full bg-gray-100 focus:outline-none focus:ring focus:ring-paseo text-center"
                    value={formatThaiPhone(phone)}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "").slice(0, 10)
                      setPhone(raw)
                    }}
                  />
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  <button
                    type="submit"
                    className="w-full text-white p-2 md:p-2 rounded-full flex justify-center items-center bg-paseo"
                    disabled={loading}
                  >
                    {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
                  </button>
                  
                </form>
            </div>
          </>
        )}

          {/* --- Step 3: กรอก OTP --- */}
          {step === 3 && (
            <>
              <div className="w-full flex flex-col justify-center items-center space-y-6">

                <h2 className="text-lg font-semibold text-center">ยืนยัน OTP</h2>
                <form onSubmit={handleStep3} className="w-full space-y-2">
                  <p className="text-sm text-gray-600">
                    ได้ส่งรหัส OTP ไปยังเบอร์ <strong>{phone}</strong>
                  </p>
                    <div className="flex flex-col gap-2 w-full justify-center items-center space-y-2">
                    <OTPInputSimple
                      value={otp}
                      onChange={(val) => {
                        setOtp(val)
                        setOtpError("")
                      }}
                    />

                    {otpError && (
                      <p className="text-red-500 text-sm text-center">{otpError}</p>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      disabled={countdown > 0}
                      className={`text-sm underline ${
                        countdown > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600'
                      }`} style={{ color: '#9DC93C' }}
                    >
                      {countdown > 0 ? `ขอ OTP อีกครั้ง (${countdown}s)` : 'ขอ OTP อีกครั้ง'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(2)} // ย้อนกลับไป Step 2
                      className="text-sm text-gray-500 underline"
                    >
                      แก้ไขเบอร์ / รหัสผ่าน
                    </button>
                  </div>
                  <Button
                  type="submit"
                    className="w-full text-white p-2 md:p-2 rounded-xl flex justify-center items-center bg-paseo"
                  >
                    ยืนยัน OTP
                  </Button>
                </form>
              </div>
            </>
          )}

          <div className="text-center mt-4">
            ยังไม่มีบัญชี?{' '}
            <Link href="/auth/register" className="font-bold text-paseo">
              สมัครสมาชิก
            </Link>
          </div>

        </div>

    </div>
  )
}