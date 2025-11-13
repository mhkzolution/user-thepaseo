import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

const prisma = new PrismaClient();

// ✅ ตรวจสอบรหัสคูปอง (สำหรับร้านค้า / staff)
export async function GET(req: NextRequest, context: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await context.params;
    const userCoupon = await prisma.userCoupon.findUnique({
      where: { redeemCode: code },
      include: {
        user: { select: { id: true, name: true, phone: true } },
        coupon: true,
      },
    });

    if (!userCoupon)
      return NextResponse.json({ error: "ไม่พบคูปองนี้ในระบบ" }, { status: 404 });

    const now = new Date();
    let status = "ACTIVE";

    if (userCoupon.coupon.expiresAt < now) status = "EXPIRED";
    if (userCoupon.used) status = "USED";

    return NextResponse.json({
      redeemCode: userCoupon.redeemCode,
      couponName: userCoupon.coupon.name,
      userName: userCoupon.user.name,
      phone: userCoupon.user.phone,
      expiresAt: userCoupon.coupon.expiresAt,
      used: userCoupon.used,
      usedAt: userCoupon.usedAt,
      status,
    });
  } catch (error) {
    console.error("❌ Verify coupon error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ✅ ยืนยันการใช้คูปอง (สำหรับ staff)
export async function POST(req: NextRequest, context: { params: Promise<{ code: string }> }) {
  try {
    const session = await getServerSession(authConfig);
    const staffId = session?.user?.id;

    if (!staffId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { code } = await context.params;
    const userCoupon = await prisma.userCoupon.findUnique({
      where: { redeemCode: code },
      include: { user: true, coupon: true },
    });

    if (!userCoupon)
      return NextResponse.json({ error: "ไม่พบคูปองนี้" }, { status: 404 });

    if (userCoupon.used)
      return NextResponse.json({ error: "คูปองนี้ถูกใช้ไปแล้ว" }, { status: 400 });

    if (new Date(userCoupon.coupon.expiresAt) < new Date())
      return NextResponse.json({ error: "คูปองนี้หมดอายุแล้ว" }, { status: 400 });

    const updated = await prisma.userCoupon.update({
      where: { id: userCoupon.id },
      data: {
        used: true,
        usedAt: new Date(),
        verifiedBy: staffId,
        verifiedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "✅ ยืนยันการใช้คูปองสำเร็จ",
      couponName: userCoupon.coupon.name,
      userName: userCoupon.user.name,
      phone: userCoupon.user.phone,
      usedAt: updated.usedAt,
    });
  } catch (error) {
    console.error("❌ Use coupon error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
