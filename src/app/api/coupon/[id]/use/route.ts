import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

const prisma = new PrismaClient();

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params; // ✅ ต้อง await
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // ✅ หา userCoupon โดยใช้ id ที่ส่งมา (id ในตาราง userCoupon)
    const userCoupon = await prisma.userCoupon.findUnique({
      where: { id },
      include: { coupon: true },
    });

    if (!userCoupon || userCoupon.userId !== userId) {
      return NextResponse.json({ error: "ไม่พบคูปองนี้ในบัญชีของคุณ" }, { status: 404 });
    }

    // ✅ ตรวจสอบสถานะ
    if (userCoupon.used) {
      return NextResponse.json({ error: "คูปองนี้ถูกใช้ไปแล้ว" }, { status: 400 });
    }

    const now = new Date();
    if (userCoupon.coupon.expiresAt < now) {
      return NextResponse.json({ error: "คูปองนี้หมดอายุแล้ว" }, { status: 400 });
    }

    // ✅ mark ว่าใช้แล้ว
    const updated = await prisma.userCoupon.update({
      where: { id: userCoupon.id },
      data: {
        used: true,
        usedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "✅ ใช้คูปองเรียบร้อยแล้ว",
      coupon: {
        name: userCoupon.coupon.name,
        redeemCode: userCoupon.redeemCode,
        usedAt: updated.usedAt,
      },
    });
  } catch (error) {
    console.error("❌ Error using coupon:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
