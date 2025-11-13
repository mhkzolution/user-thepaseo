import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // 1️⃣ สมาชิกทั้งหมด / ใหม่วันนี้ / ใหม่เดือนนี้
    const [totalUsers, newUsersToday, newUsersMonth] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
    ])

    // 2️⃣ สมาชิกใหม่รายเดือนย้อนหลัง 6 เดือน
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const users = await prisma.user.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    })

    // group เองฝั่ง JS
    const userGrowth: { month: string; count: number }[] = []
    users.forEach((u) => {
      const m = u.createdAt.toISOString().slice(0, 7) // yyyy-mm
      const found = userGrowth.find((x) => x.month === m)
      if (found) found.count++
      else userGrowth.push({ month: m, count: 1 })
    })
    userGrowth.sort((a, b) => a.month.localeCompare(b.month))

    // 3️⃣ สมาชิกตามสาขา
    const memberByBranchRaw = await prisma.branch.findMany({
      select: { id: true, name: true, _count: { select: { users: true } } },
    })
    const memberByBranch = memberByBranchRaw
      .map((b) => ({ id: b.id, name: b.name, count: b._count.users }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // 4️⃣ เพศ
    const genderGroup = await prisma.user.groupBy({
      by: ["gender"],
      _count: { gender: true },
    })

    // 5️⃣ จังหวัด
    const provinceGroup = await prisma.user.groupBy({
      by: ["province"],
      _count: { province: true },
    })
    const provinceStats = provinceGroup
      .filter((p) => p.province)
      .sort((a, b) => b._count.province - a._count.province)
      .slice(0, 5)

    // 6️⃣ อายุ (คำนวณฝั่ง JS)
    const allUsers = await prisma.user.findMany({
      where: { dateOfBirth: { not: null } },
      select: { dateOfBirth: true },
    })

    const ageGroups = {
      "ต่ำกว่า 18": 0,
      "18–25": 0,
      "26–35": 0,
      "36–50": 0,
      "มากกว่า 50": 0,
    }

    for (const u of allUsers) {
      const age = calculateAge(u.dateOfBirth!)
      if (age < 18) ageGroups["ต่ำกว่า 18"]++
      else if (age <= 25) ageGroups["18–25"]++
      else if (age <= 35) ageGroups["26–35"]++
      else if (age <= 50) ageGroups["36–50"]++
      else ageGroups["มากกว่า 50"]++
    }

    const ageGroupArr = Object.entries(ageGroups).map(([range, count]) => ({
      range,
      count,
    }))

    // 7️⃣ ความสนใจ
    const interestsRaw = await prisma.interest.findMany({
      include: { users: true },
    })
    const interests = interestsRaw
      .map((i) => ({ name: i.name, count: i.users.length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return NextResponse.json({
      totalUsers,
      newUsersToday,
      newUsersMonth,
      memberGrowth: userGrowth,
      memberByBranch,
      demographics: {
        genderStats: genderGroup.map((g) => ({
          gender: g.gender || "ไม่ระบุ",
          count: g._count.gender,
        })),
        provinceStats: provinceStats.map((p) => ({
          province: p.province || "ไม่ระบุ",
          count: p._count.province,
        })),
        ageGroups: ageGroupArr,
        interests,
      },
    })
  } catch (error: any) {
    console.error("Member dashboard error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function calculateAge(date: Date): number {
  const diff = Date.now() - date.getTime()
  const ageDt = new Date(diff)
  return Math.abs(ageDt.getUTCFullYear() - 1970)
}
