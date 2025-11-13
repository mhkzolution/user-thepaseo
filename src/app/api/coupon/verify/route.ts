import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authConfig);
    const adminId = session?.user?.id;

    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { redeemCode } = await req.json();
    if (!redeemCode) {
      return NextResponse.json({ error: "กรุณากรอกรหัสคูปอง" }, { status: 400 });
    }

    const userCoupon = await prisma.userCoupon.findUnique({
      where: { redeemCode },
      include: { user: true, coupon: true },
    });

    if (!userCoupon) {
      return NextResponse.json({ error: "ไม่พบคูปองนี้ในระบบ" }, { status: 404 });
    }

    if (userCoupon.used) {
      return NextResponse.json({
        error: `คูปองนี้ถูกใช้ไปแล้วเมื่อ ${userCoupon.usedAt?.toLocaleString()}`,
      }, { status: 400 });
    }

    const updated = await prisma.userCoupon.update({
      where: { id: userCoupon.id },
      data: {
        used: true,
        usedAt: new Date(),
        verifiedBy: adminId,
        verifiedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "✅ ยืนยันการใช้คูปองสำเร็จ",
      couponName: userCoupon.coupon.name,
      user: userCoupon.user.name,
      usedAt: updated.usedAt,
    });
  } catch (error) {
    console.error("❌ POST /api/coupon/verify error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
