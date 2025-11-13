import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

const prisma = new PrismaClient();

// ✅ GET: ดึง favorites พร้อมข้อมูลเป้าหมาย
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetId = searchParams.get("targetId");
    const targetType = searchParams.get("targetType");

    // ✅ ถ้ามี targetId + targetType → ตรวจสอบเฉพาะสถานะ
    if (targetId && targetType) {
      const existing = await prisma.favorite.findUnique({
        where: {
          userId_targetId_targetType: {
            userId: session.user.id,
            targetId,
            targetType,
          },
        },
      });
      return NextResponse.json({ isFavorite: !!existing });
    }

    // ✅ ถ้าไม่มี → ดึงรายการทั้งหมด
    const favorites = await prisma.favorite.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
      },
    });

    const result = await Promise.all(
      favorites.map(async (fav) => {
        let target: any = null;
        if (fav.targetType === "CAMPAIGN") {
          target = await prisma.campaign.findUnique({
            where: { id: fav.targetId },
            select: { id: true, name: true, imageUrl: true },
          });
        } else if (fav.targetType === "COUPON") {
          target = await prisma.coupon.findUnique({
            where: { id: fav.targetId },
            select: { id: true, name: true, imageUrl: true },
          });
        } else if (fav.targetType === "REWARD") {
          target = await prisma.reward.findUnique({
            where: { id: fav.targetId },
            select: { id: true, name: true, imageUrl: true },
          });
        } else if (fav.targetType === "EVENT") {
          target = await prisma.event.findUnique({
            where: { id: fav.targetId },
            select: { id: true, name: true, imageUrl: true },
          });
        } else if (fav.targetType === "SHOP") {
          target = await prisma.shop.findUnique({
            where: { id: fav.targetId },
            select: { id: true, name: true, imageUrl: true },
          });
        }
        return { ...fav, target };
      })
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/favorite error:", err);
    return NextResponse.json({ error: "Failed to load favorites" }, { status: 500 });
  }
}

// ✅ POST: toggle favorite
export async function POST(req: Request) {
  try {
    const { userId, targetId, targetType } = await req.json();

    if (!userId || !targetId || !targetType) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_targetId_targetType: { userId, targetId, targetType },
      },
    });

    if (existing) {
      await prisma.favorite.delete({
        where: { userId_targetId_targetType: { userId, targetId, targetType } },
      });
      return NextResponse.json({ isFavorite: false });
    } else {
      await prisma.favorite.create({
        data: { userId, targetId, targetType },
      });
      return NextResponse.json({ isFavorite: true });
    }
  } catch (error) {
    console.error("Favorite toggle error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ✅ DELETE: ยกเลิกรายการโปรด
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetId, targetType } = await req.json();
    if (!targetId || !targetType) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    await prisma.favorite.deleteMany({
      where: {
        userId: session.user.id,
        targetId,
        targetType,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/favorite error:", err);
    return NextResponse.json({ error: "Failed to delete favorite" }, { status: 500 });
  }
}
