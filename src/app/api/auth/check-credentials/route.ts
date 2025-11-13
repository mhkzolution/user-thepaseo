// app/api/auth/check-credentials/route.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  const { phone } = await req.json()

  if (!phone) {
    return NextResponse.json({ error: 'กรุณาใส่ข้อมูลให้ครบ' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { phone } })
  if (!user) {
    return NextResponse.json({ error: 'ไม่พบผู้ใช้ในระบบ' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
