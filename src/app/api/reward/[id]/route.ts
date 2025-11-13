import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const session = await getServerSession(authConfig);
    const userId = session?.user?.id || null;

    const reward = await prisma.reward.findUnique({
      where: { id },
      include: {
        shops: true,
        branches: true,
        _count: { select: { participations: true } },
      },
    });

    if (!reward) {
      return NextResponse.json({ error: "Reward not found" }, { status: 404 });
    }

    // ---- ตรวจสอบสถานะ Reward ----
    const now = new Date();
    const isExpired = reward.endDate < now;
    const isFull =
      reward.quantity !== null &&
      reward._count.participations >= reward.quantity;

    // ---- ตรวจสอบแต้มของ user ----
    let userPointBalance = 0;
    if (userId) {
      const balance = await prisma.pointBalance.findUnique({
        where: { userId },
      });
      userPointBalance = balance?.balance ?? 0;
    }

    // ---- ตรวจสอบการเข้าร่วมของ user ----
    let joinedCountByUser = 0;
    let isJoined = false;

    if (userId) {
      joinedCountByUser = await prisma.rewardParticipation.count({
        where: { userId, rewardId: reward.id },
      });
      if (
        reward.maxPerUser !== null &&
        joinedCountByUser >= reward.maxPerUser
      ) {
        isJoined = true;
      }
    }

    // ---- Label แสดงสถานที่ ----
    let locationLabel = "ไม่ระบุ";
    if (reward.isRedemption) {
      locationLabel = "🎁 จุดบริการ (Redemption)";
    } else if (reward.shops.length > 0) {
      locationLabel = `ร้านค้า: ${reward.shops.map((s) => s.name).join(", ")}`;
    } else if (reward.branches.length > 0) {
      locationLabel = `สาขา: ${reward.branches.map((b) => b.name).join(", ")}`;
    }

    // ---- ตรวจสอบสิทธิ์แลกได้ไหม ----
    const canRedeem =
      !isExpired &&
      !isFull &&
      !isJoined &&
      userPointBalance >= (reward.pointCost ?? 0);

    return NextResponse.json({
      id: reward.id,
      name: reward.name,
      description: reward.description,
      terms: reward.terms,
      imageUrl: reward.imageUrl,
      linkShare: reward.linkShare,
      pointCost: reward.pointCost || 0,
      pointEarn: reward.pointEarn || 0,
      quantity: reward.quantity || null,
      maxPerUser: reward.maxPerUser || null,
      joinedCount: reward._count.participations,
      joinedCountByUser,
      userPointBalance,
      isJoined,
      isFull,
      isExpired,
      canRedeem,
      startDate: reward.startDate,
      endDate: reward.endDate,
      locationLabel,
    });
  } catch (error) {
    console.error("❌ Error in GET /api/reward/[id]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}



export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rewardId } = await params;
    const session = await getServerSession(authConfig);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const reward = await prisma.reward.findUnique({ where: { id: rewardId } });
    if (!reward) {
      return NextResponse.json({ error: "Reward not found" }, { status: 404 });
    }

    // ✅ ใช้ findFirst แทน findUnique
    const existing = await prisma.rewardParticipation.findFirst({
      where: { rewardId, userId },
    });

    if (existing) {
      return NextResponse.json({ error: "คุณแลกรางวัลนี้ไปแล้ว" }, { status: 400 });
    }

    // ✅ สร้าง redeemCode
    function generateRedeemCode() {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let code = "";
      for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
      return code;
    }

    const participation = await prisma.rewardParticipation.create({
      data: {
        rewardId,
        userId,
        joinedAt: new Date(),
        redeemCode: generateRedeemCode(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "แลกรางวัลสำเร็จ 🎉",
      participation,
    });
  } catch (error) {
    console.error("❌ POST /api/reward/[id] error:", error);
    return NextResponse.json({ error: "Failed to join reward" }, { status: 500 });
  }
}