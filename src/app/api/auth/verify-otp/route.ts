import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const { phone, otp } = await req.json()

    if (!phone || !otp) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ครบถ้วน" },
        { status: 400 }
      )
    }

    // หา user ตามเบอร์
    const user = await prisma.user.findUnique({
      where: { phone },
    })

    if (!user) {
      return NextResponse.json(
        { error: "ไม่พบบัญชีผู้ใช้" },
        { status: 404 }
      )
    }

    // ---------------------------------------------------
    // ⭐ DEV MODE → OTP = 123456
    // ---------------------------------------------------
    if (process.env.NODE_ENV === "development") {
      if (otp === "123456") {
        // เคลียร์ OTP ออกจาก DB
        await prisma.user.update({
          where: { phone },
          data: { otp: null, otpExpiry: null },
        })

        return NextResponse.json({
          success: true,
          message: "OTP verified (DEV MODE)",
          userId: user.id,
        })
      } else {
        return NextResponse.json(
          { error: "OTP ไม่ถูกต้อง (DEV MODE)" },
          { status: 401 }
        )
      }
    }
    // ---------------------------------------------------

    // ตรวจ OTP สำหรับ Production
    if (!user.otp || user.otp !== otp) {
      return NextResponse.json(
        { error: "OTP ไม่ถูกต้อง" },
        { status: 401 }
      )
    }

    // ตรวจวันหมดอายุ OTP
    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return NextResponse.json(
        { error: "OTP หมดอายุแล้ว" },
        { status: 401 }
      )
    }

    // เคลียร์ OTP ออกจาก DB หลังยืนยันสำเร็จ
    await prisma.user.update({
      where: { phone },
      data: {
        otp: null,
        otpExpiry: null,
      },
    })

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully",
      userId: user.id,
    })
  } catch (error) {
    console.error("❌ Error verifying OTP:", error)
    return NextResponse.json(
      { error: "ไม่สามารถยืนยัน OTP ได้ในขณะนี้" },
      { status: 500 }
    )
  }
}
