// /api/auth/send-otp/route.ts
import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import twilio from "twilio"
import crypto from "crypto"

const prisma = new PrismaClient()

// ✅ โหลด Twilio Credentials จาก .env
const accountSid = process.env.TWILIO_ACCOUNT_SID!
const authToken = process.env.TWILIO_AUTH_TOKEN!
const twilioPhone = process.env.TWILIO_PHONE_NUMBER!

const client = twilio(accountSid, authToken)

// 🔐 ฟังก์ชันแปลง OTP ให้เป็น hash เพื่อความปลอดภัย
function hashOtp(otp: string) {
  return crypto.createHash("sha256").update(otp).digest("hex")
}

export async function POST(req: Request) {
  try {
    const { phone } = await req.json()

    if (!phone) {
      return NextResponse.json({ error: "กรุณาระบุเบอร์โทรศัพท์" }, { status: 400 })
    }

    // ✅ ตรวจสอบว่ามี user ในระบบไหม
    const user = await prisma.user.findUnique({ where: { phone } })
    if (!user) {
      return NextResponse.json({ error: "ไม่พบเบอร์นี้ในระบบ" }, { status: 404 })
    }

    const now = new Date()

    // ✅ ตรวจสอบว่ามี OTP ที่เพิ่งถูกขอใน 2 นาทีล่าสุดไหม (Cooldown)
    if (user.otpExpiry && user.otpExpiry > new Date(Date.now() - 2 * 60 * 1000)) {
      return NextResponse.json(
        { error: "กรุณารอ 2 นาทีก่อนขอรหัส OTP ใหม่" },
        { status: 429 }
      )
    }

    // ✅ ตรวจสอบจำนวนครั้งที่ขอ OTP ในรอบ 1 ชั่วโมงล่าสุด (Rate Limit)
    const otpRequestsIn1Hour = await prisma.otpVerification.count({
      where: {
        phone,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
    })

    if (otpRequestsIn1Hour >= 3) {
      return NextResponse.json(
        { error: "คุณขอรหัส OTP เกินจำนวนครั้งที่กำหนด กรุณาลองใหม่ภายหลัง" },
        { status: 429 }
      )
    }

    // ✅ สร้าง OTP 6 หลักแบบสุ่ม
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // ✅ กำหนดหมดอายุ 5 นาที
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000)

    // ✅ เก็บ OTP ไว้ใน User (ใช้ตอน login)
    await prisma.user.update({
      where: { phone },
      data: {
        otp: otp,
        otpExpiry: otpExpiry,
      },
    })

    // ✅ เก็บลงตาราง OtpVerification (เพื่อเช็ค Rate Limit / Log)
    await prisma.otpVerification.create({
      data: {
        phone,
        otpCode: hashOtp(otp),
        expiresAt: otpExpiry,
        purpose: "VERIFY_PHONE", // ใช้ enum ตาม model ของคุณ
      },
    })

    // ✅ ส่ง OTP ผ่าน Twilio
    const formattedPhone = phone.startsWith("+") ? phone : `+66${phone.substring(1)}`
    await client.messages.create({
      body: `รหัส OTP ของคุณคือ ${otp} (หมดอายุใน 5 นาที)`,
      from: twilioPhone,
      to: formattedPhone,
    })

    //console.log(`✅ OTP ส่งไปยัง ${formattedPhone}: ${otp}`)

    return NextResponse.json({ message: "OTP sent successfully" })
  } catch (error: any) {
    console.error("❌ Error sending OTP:", error)
    return NextResponse.json(
      { error: "ไม่สามารถส่ง OTP ได้ในขณะนี้" },
      { status: 500 }
    )
  }
}
