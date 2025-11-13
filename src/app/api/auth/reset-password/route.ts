// app/api/auth/reset-password/route.ts
import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

export async function POST(req: Request) {
  const { phone, otp, newPassword } = await req.json()

  const user = await prisma.user.findUnique({ where: { phone } })
  if (!user || user.otp !== otp) {
    return NextResponse.json({ error: "OTP ไม่ถูกต้อง" }, { status: 400 })
  }

  if (!user.otpExpiry || user.otpExpiry < new Date()) {
    return NextResponse.json({ error: "OTP หมดอายุ" }, { status: 400 })
  }

  const hashed = await bcrypt.hash(newPassword, 10)

  await prisma.user.update({
    where: { phone },
    data: {
      password: hashed,
      otp: null,
      otpExpiry: null,
    },
  })

  return NextResponse.json({ success: true })
}
