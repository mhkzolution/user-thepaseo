import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    // ✅ 1. จำนวนโค้ดที่ถูกสร้างทั้งหมด
    const referralCodesGenerated = await prisma.user.count({
      where: { referralCode: { not: "" } },
    })

    const referredMembers = await prisma.user.count({
      where: { referredBy: { not: null } },
    })

    // ✅ 3. Conversion Rate
    const conversionRate =
      referralCodesGenerated > 0
        ? ((referredMembers / referralCodesGenerated) * 100).toFixed(2)
        : "0.00"

    // ✅ 4. Top Referrers
    const topReferrersRaw = await prisma.referralLog.groupBy({
      by: ["inviterId"],
      _count: { inviteeId: true },
      orderBy: { _count: { inviteeId: "desc" } },
      take: 10,
    })

    const inviterIds = topReferrersRaw.map((r) => r.inviterId)
    const inviters = await prisma.user.findMany({
      where: { id: { in: inviterIds } },
      select: { id: true, name: true, phone: true },
    })

    const topReferrers = topReferrersRaw.map((r) => {
      const user = inviters.find((u) => u.id === r.inviterId)
      return {
        id: r.inviterId,
        name: user?.name || "ไม่ทราบชื่อ",
        phone: user?.phone,
        referrals: r._count.inviteeId,
      }
    })

    return NextResponse.json({
      referralCodesGenerated,
      referredMembers,
      conversionRate: Number(conversionRate),
      topReferrers,
    })
  } catch (error: any) {
    console.error("Referral dashboard error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
