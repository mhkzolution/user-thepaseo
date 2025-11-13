import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const [totalUsers, totalReceipts, totalPointsEarned, totalPointsRedeemed] = await Promise.all([
      prisma.user.count(),
      prisma.receipt.count(),
      prisma.pointTransaction.aggregate({
        _sum: { amount: true },
        where: { type: { in: ['EARN', 'RECEIPT'] } }
      }),
      prisma.pointTransaction.aggregate({
        _sum: { amount: true },
        where: { type: 'REDEEM' }
      }),
    ])

    // สมาชิกใหม่รายเดือน
    const userGrowth = await prisma.$queryRawUnsafe<
      { month: string; count: number }[]
    >(`
      SELECT DATE_FORMAT(createdAt, '%Y-%m') as month, COUNT(*) as count
      FROM User
      GROUP BY month
      ORDER BY month ASC
    `)

    // Top 5 รางวัลยอดนิยม
    const topRewards = await prisma.reward.findMany({
      take: 5,
      orderBy: { redeemHistories: { _count: 'desc' } },
      select: {
        id: true,
        name: true,
        _count: { select: { redeemHistories: true } },
      },
    })

    // ✅ รวมยอดขายตามสาขา
    const branchGroups = await prisma.receipt.groupBy({
      by: ['branchId'],
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 5,
    })

    const branchIds = branchGroups
    .map((b) => b.branchId)
    .filter((id): id is string => id !== null);
    const branches = await prisma.branch.findMany({
      where: { id: { in: branchIds } },
      select: { id: true, name: true },
    })

    const topBranches = branchGroups.map((b) => {
      const branch = branches.find((x) => x.id === b.branchId)
      return {
        id: b.branchId,
        name: branch?.name || 'ไม่ทราบสาขา',
        total: Number(b._sum.amount || 0),
      }
    })

    // ✅ ป้องกัน BigInt serialization error
    const safeJSON = (obj: any) =>
      JSON.parse(
        JSON.stringify(obj, (_, v) =>
          typeof v === 'bigint' ? Number(v) : v
        )
      )

    return NextResponse.json(
      safeJSON({
        totalUsers,
        totalReceipts,
        totalPointsEarned: Number(totalPointsEarned._sum.amount || 0),
        totalPointsRedeemed: Number(totalPointsRedeemed._sum.amount || 0),
        userGrowth,
        topRewards: topRewards.map(r => ({
          id: r.id,
          name: r.name,
          count: r._count.redeemHistories,
        })),
        topBranches,
      })
    )
  } catch (error: any) {
    console.error("Dashboard API Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
