import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [balance, transactions] = await Promise.all([
      prisma.pointBalance.findUnique({
        where: { userId: session.user.id },
      }),
      prisma.pointTransaction.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 50, // ดึงล่าสุด 50 รายการ
      }),
    ]);

    return NextResponse.json({
      balance: balance?.balance ?? 0,
      transactions,
    });
  } catch (error) {
    console.error("❌ GET /api/points/history:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
