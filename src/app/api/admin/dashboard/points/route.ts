import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const now = new Date()
    const next30 = new Date()
    next30.setDate(now.getDate() + 30)

    // ✅ 1. พอยท์ที่ออกทั้งหมด (issued)
    const issuedAgg = await prisma.pointTransaction.aggregate({
      _sum: { amount: true },
      where: {
        type: { in: ["EARN", "RECEIPT", "MISSION", "REFERRAL", "ADJUST"] },
      },
    })
    const issuedPoints = Number(issuedAgg._sum.amount || 0)

    // ✅ 2. พอยท์ที่ถูกใช้ (redeemed)
    const redeemedAgg = await prisma.pointTransaction.aggregate({
      _sum: { amount: true },
      where: { type: "REDEEM" },
    })
    const redeemedPoints = Math.abs(Number(redeemedAgg._sum.amount || 0))

    // ✅ 3. พอยท์คงเหลือในระบบ (outstanding)
    const outstandingAgg = await prisma.pointBalance.aggregate({
      _sum: { balance: true },
    })
    const outstandingPoints = Number(outstandingAgg._sum.balance || 0)

    // ✅ 4. พอยท์ใกล้หมดอายุ (expiring within 30 days)
    const expiringWallets = await prisma.pointWallet.findMany({
      where: {
        expiresAt: { gte: now, lte: next30 },
        points: { gt: 0 },
      },
      include: {
        user: { select: { id: true, name: true, phone: true } },
      },
    })

    const expiringPoints = expiringWallets.reduce(
      (sum, w) => sum + (w.points - w.usedPoints),
      0
    )

    return NextResponse.json({
      issuedPoints,
      redeemedPoints,
      outstandingPoints,
      expiringPoints,
      expiringWallets: expiringWallets.map((w) => ({
        id: w.id,
        userName: w.user?.name,
        phone: w.user?.phone,
        remainingPoints: w.points - w.usedPoints,
        expiresAt: w.expiresAt,
      })),
    })
  } catch (error: any) {
    console.error("Point dashboard error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
