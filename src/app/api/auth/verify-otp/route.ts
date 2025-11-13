// /api/auth/verify-otp/route.ts
import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import crypto from "crypto"
import { generateReferralCode } from "@/utils/referral";

const prisma = new PrismaClient()

function hashOtp(otp: string) {
  return crypto.createHash("sha256").update(otp).digest("hex")
}

export async function POST(req: Request) {
  try {
    const { phone, otp, purpose = "VERIFY_PHONE" } = await req.json()

    if (!phone || !otp) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 })
    }

    // ✅ หา OTP ล่าสุดของเบอร์นี้
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        phone,
        purpose,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    if (!otpRecord) {
      return NextResponse.json({ error: "ไม่พบข้อมูลการขอ OTP" }, { status: 404 })
    }

    // ✅ ตรวจสอบว่า OTP ถูกใช้ไปแล้ว
    if (otpRecord.verifiedAt) {
      return NextResponse.json({ error: "รหัส OTP นี้ถูกใช้ไปแล้ว" }, { status: 400 })
    }

    // ✅ ตรวจสอบวันหมดอายุ
    if (otpRecord.expiresAt < new Date()) {
      return NextResponse.json({ error: "รหัส OTP หมดอายุแล้ว" }, { status: 400 })
    }

    // ✅ ตรวจสอบรหัส OTP
    const hashedInput = hashOtp(otp)
    if (otpRecord.otpCode !== hashedInput) {
      return NextResponse.json({ error: "รหัส OTP ไม่ถูกต้อง" }, { status: 400 })
    }

    // ✅ อัปเดตว่าใช้ OTP นี้แล้ว
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { verifiedAt: new Date() },
    })

    // ✅ ตรวจสอบว่าผู้ใช้มีในระบบไหม
    let user = await prisma.user.findUnique({ where: { phone } })

    if (!user) {
      // กรณีใช้ตอนสมัครสมาชิก (purpose = REGISTER)
      if (purpose === "REGISTER") {
        user = await prisma.user.create({
          data: {
            phone,
            name: "สมาชิกใหม่",
            lastLogin: new Date(),
            referralCode: generateReferralCode(), 
          },
        });
      } else {
        return NextResponse.json(
          { error: "ไม่พบผู้ใช้งานในระบบ" },
          { status: 404 }
        )
      }
    }

    // ✅ อัปเดต lastLogin และล้าง OTP ใน user (ถ้ามี)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
        otp: null,
        otpExpiry: null,
      },
    })

    await prisma.otpVerification.delete({ where: { id: otpRecord.id } })

    // ✅ (Optional) สร้าง JWT / Session ตรงนี้ได้เลย
    // เช่น ถ้าใช้ NextAuth: return signIn('credentials', ...)

    return NextResponse.json({
      message: "ยืนยัน OTP สำเร็จ",
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
      },
    })
  } catch (error) {
    console.error("❌ Verify OTP Error:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการตรวจสอบ OTP" },
      { status: 500 }
    )
  }
}
