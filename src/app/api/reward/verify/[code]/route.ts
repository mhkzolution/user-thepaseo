import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

const prisma = new PrismaClient();

export async function POST(req: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await context.params;
    const session = await getServerSession(authConfig);
    const staffId = session?.user?.id;
    if (!staffId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const participation = await prisma.rewardParticipation.findUnique({
      where: { redeemCode: code },
      include: { user: true, reward: true },
    });

    if (!participation)
      return NextResponse.json({ error: "ไม่พบรางวัลนี้" }, { status: 404 });
    if (participation.redeemed)
      return NextResponse.json({ error: "รางวัลนี้ถูกใช้ไปแล้ว" }, { status: 400 });

    const updated = await prisma.rewardParticipation.update({
      where: { id: participation.id },
      data: {
        redeemed: true,
        redeemedAt: new Date(),
        verifiedBy: staffId,
        verifiedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "✅ ยืนยันการใช้รางวัลสำเร็จ",
      userName: participation.user.name,
      rewardName: participation.reward.name,
      usedAt: updated.redeemedAt,
    });
  } catch (error) {
    console.error("❌ POST /api/reward/verify/[code] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
