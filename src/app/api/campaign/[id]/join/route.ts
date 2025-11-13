import { NextResponse } from "next/server";
import { PrismaClient, PointType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

const prisma = new PrismaClient();

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authConfig);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const userId = session.user.id;

    // ✅ หา campaign
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        participations: { where: { userId } },
        _count: { select: { participations: true } },
      },
    });

    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

    const now = new Date();
    if (campaign.startDate > now) return NextResponse.json({ error: "แคมเปญยังไม่เริ่ม" }, { status: 400 });
    if (campaign.endDate < now) return NextResponse.json({ error: "แคมเปญสิ้นสุดแล้ว" }, { status: 400 });

    if (campaign.quantity !== null && campaign._count.participations >= campaign.quantity) {
      return NextResponse.json({ error: "Campaign เต็มแล้ว" }, { status: 400 });
    }

    if (campaign.maxPerUser !== null && campaign.participations.length >= campaign.maxPerUser) {
      return NextResponse.json({ error: "คุณเข้าร่วมครบจำนวนที่กำหนดแล้ว" }, { status: 400 });
    }

    // ✅ ตรวจสอบ point balance ของ user
    let pointBalance = await prisma.pointBalance.findUnique({ where: { userId } });

    if (!pointBalance) {
      const userExists = await prisma.user.findUnique({ where: { id: userId } });
      if (!userExists) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      pointBalance = await prisma.pointBalance.create({ data: { userId, balance: 0 } });
    }

    if (campaign.pointCost && pointBalance.balance < campaign.pointCost) {
      return NextResponse.json({ error: "แต้มไม่เพียงพอ" }, { status: 400 });
    }

    // ✅ Transaction
    const participation = await prisma.$transaction(async (tx) => {
  let updatedBalance = pointBalance!.balance;

  // --- หัก pointCost ของ campaign
  if (campaign.pointCost && campaign.pointCost > 0) {
    updatedBalance -= campaign.pointCost;
    await tx.pointTransaction.create({
      data: {
        userId,
        type: PointType.REDEEM,
        amount: -campaign.pointCost,
        balanceAfter: updatedBalance,
        referenceId: campaign.id,
        description: `Join campaign: ${campaign.name}`,
      },
    });
  }

  // --- บวก pointEarn ของ campaign
  if (campaign.pointEarn && campaign.pointEarn > 0) {
    updatedBalance += campaign.pointEarn;
    await tx.pointTransaction.create({
      data: {
        userId,
        type: PointType.EARN,
        amount: campaign.pointEarn,
        balanceAfter: updatedBalance,
        referenceId: campaign.id,
        description: `Campaign pointEarn: ${campaign.name}`,
      },
    });
  }

  // --- อัปเดต balance
  await tx.pointBalance.update({
    where: { userId },
    data: { balance: updatedBalance },
  });

  // --- assign coupons ของ campaign
  const campaignWithCoupons = await tx.campaign.findUnique({
    where: { id: campaign.id },
    include: { coupons: true },
  });

  if (campaignWithCoupons?.coupons) {
    for (const coupon of campaignWithCoupons.coupons) {
      if (!coupon.autoAssign) continue;

      // เช็กว่าผู้ใช้มี coupon นี้อยู่แล้วหรือยัง
      const already = await tx.userCoupon.findFirst({
        where: { userId, couponId: coupon.id },
      });
      if (already) continue;

      // quota check
      const userCount = await tx.userCoupon.count({
        where: { userId, couponId: coupon.id },
      });
      if (
        (coupon.maxPerUser && userCount >= coupon.maxPerUser) ||
        (coupon.quantity && coupon.quantity <= 0)
      ) {
        continue;
      }

      // assign coupon
      await tx.userCoupon.create({
        data: { userId, couponId: coupon.id },
      });

      // ลด quantity
      if (coupon.quantity && coupon.quantity > 0) {
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { quantity: { decrement: 1 } },
        });
      }

      // --- log pointCost ของ coupon
      if (coupon.pointCost && coupon.pointCost > 0) {
        updatedBalance -= coupon.pointCost;
        await tx.pointTransaction.create({
          data: {
            userId,
            type: PointType.REDEEM,
            amount: -coupon.pointCost,
            balanceAfter: updatedBalance,
            referenceId: coupon.id,
            description: `Receive coupon: ${coupon.name} (cost)`,
          },
        });
      }

      // --- log pointEarn ของ coupon
      if (coupon.pointEarn && coupon.pointEarn > 0) {
        updatedBalance += coupon.pointEarn;
        await tx.pointTransaction.create({
          data: {
            userId,
            type: PointType.EARN,
            amount: coupon.pointEarn,
            balanceAfter: updatedBalance,
            referenceId: coupon.id,
            description: `Receive coupon: ${coupon.name} (earn)`,
          },
        });
      }

      // อัปเดต balance หลังจากรับคูปอง
      await tx.pointBalance.update({
        where: { userId },
        data: { balance: updatedBalance },
      });
    }
  }

  // --- participation
  return tx.campaignParticipation.create({
    data: { userId, campaignId: campaign.id },
  });
});


    return NextResponse.json({ message: "เข้าร่วมแคมเปญเรียบร้อย", participation });
  } catch (error) {
    console.error("Error joining campaign:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
