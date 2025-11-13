// /api/auth/register/send-otp/route.ts
import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import crypto from "crypto"
import twilio from "twilio"

const prisma = new PrismaClient()

// ✅ Twilio credentials (เก็บใน .env)
const accountSid = process.env.TWILIO_ACCOUNT_SID!
const authToken = process.env.TWILIO_AUTH_TOKEN!
const twilioPhone = process.env.TWILIO_PHONE_NUMBER!

const client = twilio(accountSid, authToken)

// ✅ Helper: สร้างรหัส OTP
function generateOtp(length: number = 6) {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function hashOtp(otp: string) {
  return crypto.createHash("sha256").update(otp).digest("hex")
}


// ✅ regex สำหรับเบอร์ไทย
const thaiPhoneRegex = /^0[689]\d{8}$/

export async function POST(req: Request) {
  try {
    const { phone } = await req.json()

    if (!phone) {
      return NextResponse.json({ error: "กรุณาระบุเบอร์โทรศัพท์" }, { status: 400 })
    }

    // ✅ ตรวจสอบรูปแบบเบอร์โทร
    if (!thaiPhoneRegex.test(phone)) {
      return NextResponse.json({ error: "รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง" }, { status: 400 })
    }

    // ✅ ตรวจสอบว่าเบอร์นี้เคยสมัครหรือยัง
    const existingUser = await prisma.user.findUnique({ where: { phone } })
    if (existingUser) {
      return NextResponse.json({ error: "เบอร์นี้ลงทะเบียนแล้ว" }, { status: 400 })
    }

    // ✅ ตรวจสอบ Cooldown: มี OTP ที่เพิ่งสร้างใน 2 นาทีล่าสุดไหม
    const recentOtp = await prisma.otpVerification.findFirst({
      where: {
        phone,
        purpose: "REGISTER",
        createdAt: { gte: new Date(Date.now() - 2 * 60 * 1000) },
      },
    })
    if (recentOtp) {
      return NextResponse.json(
        { error: "กรุณารอ 2 นาทีก่อนขอรหัส OTP ใหม่" },
        { status: 429 }
      )
    }

    // ✅ ตรวจสอบ Rate Limit: ขอ OTP ได้ไม่เกิน 3 ครั้งต่อชั่วโมง
    const otpRequestsIn1Hour = await prisma.otpVerification.count({
      where: {
        phone,
        purpose: "REGISTER",
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
    })
    if (otpRequestsIn1Hour >= 3) {
      return NextResponse.json(
        { error: "คุณขอรหัส OTP เกินจำนวนครั้งที่กำหนด กรุณาลองใหม่ภายหลัง" },
        { status: 429 }
      )
    }

    // ✅ ลบ OTP เก่าของเบอร์นี้ก่อน (เผื่อหลงเหลือ)
    await prisma.otpVerification.deleteMany({
      where: { phone, purpose: "REGISTER" },
    })

    // ✅ สร้าง OTP ใหม่
    const otp = generateOtp()
    const hashedOtp = hashOtp(otp)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // หมดอายุใน 5 นาที

    await prisma.otpVerification.create({
      data: {
        phone,
        otpCode: hashedOtp,
        expiresAt,
        purpose: "REGISTER",
      },
    })

    // ✅ ส่ง OTP จริงผ่าน Twilio
    const formattedPhone = phone.startsWith("+") ? phone : `+66${phone.substring(1)}`
    await client.messages.create({
      body: `รหัส OTP สำหรับสมัครสมาชิกคือ ${otp} (หมดอายุใน 5 นาที)`,
      from: twilioPhone,
      to: formattedPhone,
    })

    console.log(`✅ Register OTP ส่งไปยัง ${formattedPhone}: ${otp}`)

    return NextResponse.json({ message: "ส่งรหัส OTP สำเร็จ" })
  } catch (error: any) {
    console.error("❌ Register Send OTP Error:", error)
    return NextResponse.json(
      { error: "ไม่สามารถส่งรหัส OTP ได้ในขณะนี้" },
      { status: 500 }
    )
  }
}
