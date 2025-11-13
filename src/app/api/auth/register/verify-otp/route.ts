import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const { phone, otp } = await req.json()

    if (!phone || !otp) {
      return NextResponse.json({ error: "กรุณากรอกเบอร์โทรศัพท์และรหัส OTP" }, { status: 400 })
    }

    // ✅ ลบ OTP ที่หมดอายุแล้ว (cleanup)
    await prisma.otpVerification.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    })

    // ✅ หา OTP ล่าสุดของเบอร์นี้
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        phone,
        purpose: "REGISTER",
      },
      orderBy: { createdAt: "desc" },
    })

    if (!otpRecord) {
      return NextResponse.json({ error: "ไม่พบข้อมูลการขอรหัส OTP" }, { status: 404 })
    }

    // ✅ ตรวจสอบว่า OTP ถูกใช้ไปแล้วหรือยัง
    if (otpRecord.verifiedAt) {
      return NextResponse.json({ error: "รหัส OTP นี้ถูกใช้ไปแล้ว" }, { status: 400 })
    }

    // ✅ ตรวจสอบวันหมดอายุ
    if (otpRecord.expiresAt < new Date()) {
      return NextResponse.json({ error: "รหัส OTP หมดอายุแล้ว" }, { status: 400 })
    }

    // ✅ ตรวจสอบ OTP ว่าตรงกันหรือไม่ (ไม่ใช้ hash)
    if (otpRecord.otpCode !== otp) {
      return NextResponse.json({ error: "รหัส OTP ไม่ถูกต้อง" }, { status: 400 })
    }

    // ✅ Mark OTP ว่าใช้แล้ว
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { verifiedAt: new Date() },
    })

    // ✅ ตรวจสอบว่ามี user อยู่แล้วไหม
    const existingUser = await prisma.user.findUnique({ where: { phone } })
    if (existingUser) {
      return NextResponse.json({ error: "เบอร์นี้ลงทะเบียนแล้ว" }, { status: 400 })
    }

    // ✅ สร้าง user ใหม่
    const newUser = await prisma.user.create({
      data: {
        phone,
        name: "สมาชิกใหม่",
        referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    // ✅ ลบ OTP record หลังจากยืนยันแล้ว
    await prisma.otpVerification.delete({ where: { id: otpRecord.id } })

    return NextResponse.json({
      success: true,
      message: "ยืนยัน OTP สำเร็จ และสมัครสมาชิกเรียบร้อยแล้ว",
      user: {
        id: newUser.id,
        phone: newUser.phone,
        name: newUser.name,
      },
    })
  } catch (error: any) {
    console.error("❌ Register Verify OTP Error:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการตรวจสอบรหัส OTP" },
      { status: 500 }
    )
  }
}
