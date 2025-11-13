import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

const prisma = new PrismaClient();

/**
 * ✅ GET: แสดงเฉพาะคูปองที่ลูกค้า "กดใช้แล้ว" แต่ยังไม่ verified
 */
export async function GET() {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user || !["ADMIN", "STAFF"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const userCoupons = await prisma.userCoupon.findMany({
      where: {
        used: true,
        verifiedAt: null, // ยังไม่ถูกตรวจ
      },
      include: {
        user: { select: { id: true, name: true, phone: true } },
        coupon: { select: { id: true, name: true, code: true, expiresAt: true } },
      },
      orderBy: { usedAt: "desc" },
    });

    return NextResponse.json(
      userCoupons.map((uc) => ({
        id: uc.id,
        redeemCode: uc.redeemCode,
        couponName: uc.coupon.name,
        couponCode: uc.coupon.code,
        userName: uc.user.name,
        userPhone: uc.user.phone,
        usedAt: uc.usedAt,
      }))
    );
  } catch (error) {
    console.error("❌ Error fetching used coupons:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * ✅ POST: แอดมินกดยืนยันการใช้ (verify)
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user || !["ADMIN", "STAFF"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { couponId } = await req.json();
    const adminId = session.user.id;

    const coupon = await prisma.userCoupon.findUnique({ where: { id: couponId } });
    if (!coupon) {
      return NextResponse.json({ error: "ไม่พบคูปองนี้" }, { status: 404 });
    }

    if (coupon.verifiedAt) {
      return NextResponse.json({ error: "คูปองนี้ถูกตรวจสอบไปแล้ว" }, { status: 400 });
    }

    const updated = await prisma.userCoupon.update({
      where: { id: couponId },
      data: {
        verifiedBy: adminId,
        verifiedAt: new Date(),
      },
    });

    return NextResponse.json({ message: "✅ ยืนยันคูปองเรียบร้อยแล้ว", updated });
  } catch (error) {
    console.error("❌ Error verifying coupon:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
