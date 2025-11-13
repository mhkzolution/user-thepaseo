import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

const prisma = new PrismaClient();

/**
 * ✅ GET: แสดงเฉพาะ reward ที่ user แลกแล้ว (redeemed=true) แต่ยังไม่ verified
 */
export async function GET() {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user || !["ADMIN", "STAFF"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const participations = await prisma.rewardParticipation.findMany({
      where: {
        redeemed: true,
        verifiedAt: null,
      },
      include: {
        user: { select: { id: true, name: true, phone: true } },
        reward: { select: { id: true, name: true, pointCost: true } },
      },
      orderBy: { redeemedAt: "desc" },
    });

    return NextResponse.json(
      participations.map((p) => ({
        id: p.id,
        rewardName: p.reward.name,
        userName: p.user.name,
        userPhone: p.user.phone,
        redeemCode: p.redeemCode,
        redeemedAt: p.redeemedAt,
      }))
    );
  } catch (error) {
    console.error("❌ Error fetching reward participations:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * ✅ POST: ยืนยันการใช้รางวัล (โดย ADMIN/STAFF)
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user || !["ADMIN", "STAFF"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { participationId } = await req.json();
    const adminId = session.user.id;

    const participation = await prisma.rewardParticipation.findUnique({
      where: { id: participationId },
    });

    if (!participation) {
      return NextResponse.json({ error: "ไม่พบข้อมูลรางวัลนี้" }, { status: 404 });
    }

    if (participation.verifiedAt) {
      return NextResponse.json({ error: "รางวัลนี้ถูกตรวจสอบไปแล้ว" }, { status: 400 });
    }

    const updated = await prisma.rewardParticipation.update({
      where: { id: participationId },
      data: {
        verifiedBy: adminId,
        verifiedAt: new Date(),
      },
    });

    return NextResponse.json({ message: "✅ ยืนยันรางวัลเรียบร้อยแล้ว", updated });
  } catch (error) {
    console.error("❌ Error verifying reward:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
