import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

const prisma = new PrismaClient();

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authConfig);
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const participation = await prisma.rewardParticipation.findUnique({
      where: { id },
      include: { reward: true },
    });

    if (!participation || participation.userId !== userId)
      return NextResponse.json({ error: "ไม่พบรางวัลนี้ในบัญชีของคุณ" }, { status: 404 });
    if (participation.redeemed)
      return NextResponse.json({ error: "รางวัลนี้ถูกใช้ไปแล้ว" }, { status: 400 });

    const updated = await prisma.rewardParticipation.update({
      where: { id },
      data: {
        redeemed: true,
        redeemedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "✅ ใช้รางวัลสำเร็จ",
      usedAt: updated.redeemedAt,
      rewardName: participation.reward.name,
    });
  } catch (error) {
    console.error("❌ POST /api/reward/[id]/use error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
