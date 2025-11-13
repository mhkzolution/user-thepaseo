//api/coupon
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

const prisma = new PrismaClient();

// ✅ GET: ดึงคูปองทั้งหมดที่ user มี
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const userCoupons = await prisma.userCoupon.findMany({
      where: { userId },
      orderBy: { assignedAt: "desc" },
      include: {
        coupon: {
          include: {
            campaign: { select: { id: true, name: true } },
          },
        },
      },
    });

    // format response
    const result = userCoupons.map((uc) => ({
      id: uc.id,
      used: uc.used,
      assignedAt: uc.assignedAt,
      coupon: {
        id: uc.coupon.id,
        code: uc.coupon.code,
        name: uc.coupon.name,
        description: uc.coupon.description,
        terms: uc.coupon.terms,
        imageUrl: uc.coupon.imageUrl,
        pointCost: uc.coupon.pointCost,
        pointEarn: uc.coupon.pointEarn,
        quantity: uc.coupon.quantity,
        maxPerUser: uc.coupon.maxPerUser,
        expiresAt: uc.coupon.expiresAt,
        campaign: uc.coupon.campaign
          ? { id: uc.coupon.campaign.id, name: uc.coupon.campaign.name }
          : null,
      },
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ Error fetching user coupons:", error);
    return NextResponse.json({ error: "Failed to fetch user coupons" }, { status: 500 });
  }
}
