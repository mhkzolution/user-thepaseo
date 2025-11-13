import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const now = new Date()

    // ✅ Active campaigns
    const activeCampaigns = await prisma.campaign.count({
      where: { startDate: { lte: now }, endDate: { gte: now } },
    })

    // ✅ Ended campaigns
    const endedCampaigns = await prisma.campaign.count({
      where: { endDate: { lt: now } },
    })

    // ✅ รวมคูปองที่แจกทั้งหมด
    const totalCoupons = await prisma.userCoupon.count()

    // ✅ รวมคูปองที่ใช้จริง
    const usedCoupons = await prisma.userCoupon.count({
      where: { used: true },
    })

    // ✅ คำนวณ Usage Rate ต่อแคมเปญ
    const campaigns = await prisma.campaign.findMany({
      include: {
        coupons: {
          include: {
            users: true,
          },
        },
      },
    })

    const campaignUsage = campaigns.map((c) => {
      const distributed = c.coupons.reduce((sum, cp) => sum + cp.users.length, 0)
      const used = c.coupons.reduce(
        (sum, cp) => sum + cp.users.filter((u) => u.used).length,
        0
      )
      const usageRate = distributed > 0 ? (used / distributed) * 100 : 0
      return {
        id: c.id,
        name: c.name,
        distributed,
        used,
        usageRate: Number(usageRate.toFixed(2)),
      }
    })

    // ✅ ยอดขายจาก Coupon (Campaign ROI)
    // ✅ ใช้ PointTransaction ที่ reference coupon
    const couponTransactions = await prisma.pointTransaction.findMany({
      where: { couponId: { not: null } },
      select: { amount: true, couponId: true },
    })

    // รวมยอดขายจาก Coupon
    const couponSalesMap: Record<string, number> = {}
    couponTransactions.forEach((txn) => {
      couponSalesMap[txn.couponId!] =
        (couponSalesMap[txn.couponId!] || 0) + txn.amount
    })

    // ดึงแคมเปญเพื่อ map ROI
    const campaignROI = await prisma.campaign.findMany({
      include: { coupons: true },
    })

    const roiData = campaignROI.map((c) => {
      const relatedCoupons = c.coupons.map((cp) => cp.id)
      const totalSales = relatedCoupons.reduce(
        (sum, id) => sum + (couponSalesMap[id] || 0),
        0
      )
      return {
        id: c.id,
        name: c.name,
        totalSales,
      }
    })

    return NextResponse.json({
      activeCampaigns,
      endedCampaigns,
      totalCoupons,
      usedCoupons,
      campaignUsage,
      roiData,
    })
  } catch (error: any) {
    console.error("Coupon dashboard error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
