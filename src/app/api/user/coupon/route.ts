import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) return NextResponse.json([], { status: 401 });

  const userCoupons = await prisma.userCoupon.findMany({
    where: { userId: session.user.id },
    orderBy: { assignedAt: "desc" },
    include: {
      coupon: {
        include: {
          campaign: {
            select: {
              id: true,
              name: true }
            }
          },
      },
    },
  });

  return NextResponse.json(userCoupons);
}
