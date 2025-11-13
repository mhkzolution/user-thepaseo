// app/api/admin/send-weekly-summary/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { PrismaClient } from "@prisma/client";
import { sendWeeklySummaryToAllUsers } from "@/lib/weeklyPointSummary";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const prisma = new PrismaClient();

export async function POST(req: Request) {
  // ถ้าต้องการให้เรียกเฉพาะ admin จากภายนอก
  const session = await getServerSession(authConfig);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const result = await sendWeeklySummaryToAllUsers({
      limitPerBatch: 30, // ปรับตาม rate limit
      delayMs: 1500,
    });
    return NextResponse.json({ success: true, result });
  } catch (err) {
    console.error("send-weekly-summary error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
