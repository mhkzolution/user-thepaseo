import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const month = searchParams.get("month")
    const year = searchParams.get("year")
    const branchId = searchParams.get("branchId")

    let startDate: Date | undefined
    let endDate: Date | undefined

    if (month && year) {
      startDate = new Date(Number(year), Number(month) - 1, 1)
      endDate = new Date(Number(year), Number(month), 0)
    } else if (year) {
      startDate = new Date(Number(year), 0, 1)
      endDate = new Date(Number(year), 11, 31)
    }

    // ✅ Filter base condition
    const where: any = {}
    if (branchId) where.branchId = branchId
    if (startDate && endDate) where.createdAt = { gte: startDate, lte: endDate }

    // Total Spending
    const totalAgg = await prisma.receipt.aggregate({
      _sum: { amount: true },
      where,
    })
    const totalSpending = Number(totalAgg._sum.amount || 0)

    // Total Users (active in that period)
    const userCount = await prisma.user.count()

    // Average Spending
    const averageSpending = userCount > 0 ? totalSpending / userCount : 0

    // Category Spending
    const categories = await prisma.shopCategory.findMany({
      include: {
        shops: {
          include: {
            receipts: {
              where,
              select: { amount: true },
            },
          },
        },
      },
    })

    const spendingByCategory = categories.map((c) => ({
      id: c.id,
      name: c.name,
      total: c.shops.reduce(
        (sum, s) => sum + s.receipts.reduce((acc, r) => acc + r.amount, 0),
        0
      ),
    }))

    // Branch Spending
    const branches = await prisma.branch.findMany({
      include: {
        receipts: { where, select: { amount: true } },
      },
    })
    const spendingByBranch = branches.map((b) => ({
      id: b.id,
      name: b.name,
      total: b.receipts.reduce((sum, r) => sum + r.amount, 0),
    }))

    // Top Shops
    const shops = await prisma.shop.findMany({
      include: {
        receipts: { where, select: { amount: true } },
      },
    })
    const topShops = shops
      .map((s) => ({
        id: s.id,
        name: s.name,
        total: s.receipts.reduce((sum, r) => sum + r.amount, 0),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)

    // Previous Month for Growth
    const prevWhere = { ...where }
    if (month && year) {
      const prevMonth = Number(month) - 1
      const prevYear = prevMonth === 0 ? Number(year) - 1 : Number(year)
      const prevMonthIndex = prevMonth === 0 ? 12 : prevMonth
      const prevStart = new Date(prevYear, prevMonthIndex - 1, 1)
      const prevEnd = new Date(prevYear, prevMonthIndex, 0)
      prevWhere.createdAt = { gte: prevStart, lte: prevEnd }
    }

    const prevAgg = await prisma.receipt.aggregate({
      _sum: { amount: true },
      where: prevWhere,
    })
    const prevSpending = Number(prevAgg._sum.amount || 0)
    const growth = prevSpending > 0 ? ((totalSpending - prevSpending) / prevSpending) * 100 : 0

    return NextResponse.json({
      totalSpending,
      averageSpending,
      growth,
      spendingByCategory,
      spendingByBranch,
      topShops,
    })
  } catch (error: any) {
    console.error("Transaction dashboard error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
