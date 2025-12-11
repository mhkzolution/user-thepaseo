import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import twilio from "twilio"
import crypto from "crypto"

const prisma = new PrismaClient()

// Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID!
const authToken = process.env.TWILIO_AUTH_TOKEN!
const twilioPhone = process.env.TWILIO_PHONE_NUMBER!

const client = twilio(accountSid, authToken)

// 🔐 ฟังก์ชันสำหรับ hash OTP
function hashOtp(otp: string) {
  return crypto.createHash("sha256").update(otp).digest("hex")
}

export async function POST(req: Request) {
  try {
    const { phone } = await req.json()

    if (!phone) {
      return NextResponse.json(
        { error: "กรุณาระบุเบอร์โทรศัพท์" },
        { status: 400 }
      )
    }

    // ตรวจสอบ user
    const user = await prisma.user.findUnique({ where: { phone } })

    if (!user) {
      return NextResponse.json(
        { error: "ไม่พบเบอร์นี้ในระบบ" },
        { status: 404 }
      )
    }

    const now = new Date()

    // ⏳ Cooldown: ขอ OTP ซ้ำภายใน 2 นาที
    if (user.otpExpiry && user.otpExpiry > new Date(Date.now() - 2 * 60 * 1000)) {
      return NextResponse.json(
        { error: "กรุณารอ 2 นาทีก่อนขอรหัส OTP ใหม่" },
        { status: 429 }
      )
    }

    // 🔁 Rate Limit: ขอได้สูงสุด 3 ครั้งใน 1 ชั่วโมง
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

    // ---------------------------------------------------------
    // ⭐⭐ DEV MODE — ไม่ส่ง SMS, ใช้ OTP = 123456 ⭐⭐
    // ---------------------------------------------------------
    if (process.env.NODE_ENV === "development") {
      const otp = "123456"
      const otpExpiry = new Date(Date.now() + 5 * 60 * 1000)

      await prisma.user.update({
        where: { phone },
        data: { otp, otpExpiry },
      })

      await prisma.otpVerification.create({
        data: {
          phone,
          otpCode: hashOtp(otp),
          expiresAt: otpExpiry,
          purpose: "VERIFY_PHONE",
        },
      })

      console.log("💡 DEV MODE OTP:", otp)

      return NextResponse.json({
        message: "OTP generated (DEV MODE)",
        devMode: true,
        otp, // ส่งให้ front-end โชว์ alert ได้
      })
    }
    // ---------------------------------------------------------

    // สร้าง OTP สุ่มสำหรับ Production
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000)

    // บันทึกลง user
    await prisma.user.update({
      where: { phone },
      data: { otp, otpExpiry },
    })

    // Log OTP
    await prisma.otpVerification.create({
      data: {
        phone,
        otpCode: hashOtp(otp),
        expiresAt: otpExpiry,
        purpose: "VERIFY_PHONE",
      },
    })

    // แปลงเบอร์ +66
    const formattedPhone =
      phone.startsWith("+") ? phone : `+66${phone.substring(1)}`

    // ส่ง SMS ผ่าน Twilio
    await client.messages.create({
      body: `รหัส OTP ของคุณคือ ${otp} (หมดอายุใน 5 นาที)`,
      from: twilioPhone,
      to: formattedPhone,
    })

    console.log(`📨 OTP sent to ${formattedPhone}`)

    return NextResponse.json({ message: "OTP sent successfully" })
  } catch (error: any) {
    console.error("❌ Error sending OTP:", error)
    return NextResponse.json(
      { error: "ไม่สามารถส่ง OTP ได้ในขณะนี้" },
      { status: 500 }
    )
  }
}
