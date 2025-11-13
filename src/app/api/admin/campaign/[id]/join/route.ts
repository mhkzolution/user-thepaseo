// app/api/admin/campaign/[id]/join/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { userId } = body; // รับ userId มาจาก frontend

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: { coupons: true },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // ✅ ตรวจสอบว่า user เข้าร่วมไปแล้วหรือยัง
    const alreadyJoined = await prisma.campaignParticipation.findFirst({
      where: { campaignId: id, userId },
    });

    if (alreadyJoined) {
      return NextResponse.json({ error: "User already joined this campaign" }, { status: 400 });
    }

    // ✅ สร้าง participation
    const participation = await prisma.campaignParticipation.create({
      data: {
        campaignId: id,
        userId,
      },
    });

    // ✅ ถ้ามี coupon ที่ autoAssign → แจก coupon ให้ user
    const autoCoupons = campaign.coupons.filter((c) => c.autoAssign);

    for (const coupon of autoCoupons) {
      // ตรวจสอบว่า user ได้รับ coupon นี้แล้วหรือยัง
      const hasCoupon = await prisma.userCoupon.findFirst({
        where: { userId, couponId: coupon.id },
      });

      if (!hasCoupon) {
        await prisma.userCoupon.create({
          data: {
            userId,
            couponId: coupon.id,
          },
        });
      }
    }

    return NextResponse.json({
      message: "User joined campaign successfully",
      participation,
      autoCouponsAssigned: autoCoupons.map((c) => c.code),
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
