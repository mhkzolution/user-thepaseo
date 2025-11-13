import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

/**
 * ✅ GET /api/profile/reward
 * ดึงเฉพาะ Reward ที่ user เคยแลก (จาก RewardParticipation)
 */
export async function GET() {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // ✅ ดึง reward ที่ user แลกไว้ทั้งหมด
    const rewards = await prisma.rewardParticipation.findMany({
      where: { userId },
      include: { reward: true },
      orderBy: { joinedAt: "desc" },
    });

    return NextResponse.json({
      userId,
      rewards: rewards.map((rp) => ({
        id: rp.id,
        redeemed: rp.redeemed,
        redeemedAt: rp.redeemedAt,
        redeemCode: rp.redeemCode,
        joinedAt: rp.joinedAt,
        reward: {
          id: rp.reward.id,
          name: rp.reward.name,
          imageUrl: rp.reward.imageUrl,
          endDate: rp.reward.endDate,
          pointCost: rp.reward.pointCost,
        },
      })),
    });
  } catch (error) {
    console.error("❌ Error fetching rewards:", error);
    return NextResponse.json(
      { error: "Failed to fetch rewards" },
      { status: 500 }
    );
  }
}
