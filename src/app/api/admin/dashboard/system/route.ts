import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// สมมติเรามีฟังก์ชันเช็กสุขภาพระบบจริง เช่น Ping API, LINE OA
async function checkSystemHealth() {
  const health = {
    api: false,
    webhook: false,
    line: false,
  }

  try {
    const apiPing = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/health`).then(r => r.ok)
    health.api = apiPing
  } catch {
    health.api = false
  }

  try {
    const webhook = await fetch(`${process.env.WEBHOOK_URL}/health`).then(r => r.ok)
    health.webhook = webhook
  } catch {
    health.webhook = false
  }

  try {
    const linePing = await fetch("https://api.line.me/v2/bot/info", {
      headers: { Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}` },
    })
    health.line = linePing.ok
  } catch {
    health.line = false
  }

  return health
}

export async function GET() {
  try {
    // ✅ 1. Staff activity logs ล่าสุด
    const recentLogs = await prisma.auditLog.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        admin: { select: { name: true, role: true } },
      },
    })

    // ✅ 2. Summary log type (count by action)
    const summary = await prisma.auditLog.groupBy({
      by: ["action"],
      _count: { action: true },
    })

    // ✅ 3. Error Reports (receipt upload failed)
    const errorReports = await prisma.receipt.findMany({
  where: { status: "REJECTED" },
  include: {
    user: {
      select: { id: true, name: true, phone: true },
    },
  },
  take: 10,
  orderBy: { createdAt: "desc" },
})

    // ✅ 4. System Health
    const health = await checkSystemHealth()

    return NextResponse.json({
      recentLogs,
      summary,
      errorReports,
      health,
    })
  } catch (error: any) {
    console.error("System Dashboard Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
