import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const last7Days = new Date(now)
    last7Days.setDate(now.getDate() - 7)

    // ✅ จำนวน Redeem วันนี้
    const dailyRedeem = await prisma.redemption.count({
      where: { createdAt: { gte: startOfToday } },
    })

    // ✅ จำนวน Redeem เดือนนี้
    const monthlyRedeem = await prisma.redemption.count({
      where: { createdAt: { gte: startOfMonth } },
    })

    // ✅ Trend รายวันย้อนหลัง 7 วัน
    const redeemLogs = await prisma.redemption.findMany({
      where: { createdAt: { gte: last7Days } },
      select: { createdAt: true },
    })

    const dailyTrend: Record<string, number> = {}
    redeemLogs.forEach((r) => {
      const day = r.createdAt.toISOString().slice(0, 10)
      dailyTrend[day] = (dailyTrend[day] || 0) + 1
    })
    const redeemTrend = Object.entries(dailyTrend).map(([date, count]) => ({
      date,
      count,
    }))

    // ✅ Reward Inventory
    const rewards = await prisma.reward.findMany({
      select: {
        id: true,
        name: true,
        quantity: true,
        _count: { select: { redemptions: true } },
      },
    })

    const rewardInventory = rewards.map((r) => ({
      id: r.id,
      name: r.name,
      totalStock: r.quantity || 0,
      redeemed: r._count.redemptions,
      remaining: Math.max((r.quantity || 0) - r._count.redemptions, 0),
    }))

    return NextResponse.json({
      dailyRedeem,
      monthlyRedeem,
      redeemTrend,
      rewardInventory,
    })
  } catch (error: any) {
    console.error("Redemption Dashboard Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
