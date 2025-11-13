// app/api/coupon/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get("shopId");

  try {
    const now = new Date();
    const sevenDaysAfter = new Date(now);
    sevenDaysAfter.setDate(now.getDate() - 0);

    const coupons = await prisma.coupon.findMany({
      where: {
        ...(shopId
          ? { shops: { some: { id: shopId } } }
          : {}),

        OR: [
          { startDate: { gte: now } },
          { AND: [{ startDate: { lte: now } }, { endDate: { gte: now } }] },
          { AND: [{ endDate: { lt: now } }, { endDate: { gte: sevenDaysAfter } }] },
        ],
      },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
        shops: { // ✅ include ชื่อร้านด้วยถ้าจำเป็น
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = coupons.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      imageUrl: c.imageUrl,
      pointCost: c.pointCost,
      pointEarn: c.pointEarn,
      startDate: c.startDate,
      endDate: c.endDate,
      expiresAt: c.expiresAt,
      campaign: c.campaign,
      status:
        c.startDate && c.startDate > now
          ? "upcoming" // ยังไม่เริ่ม
          : c.endDate && c.endDate >= now
          ? "active" // ใช้งานได้
          : "expired", // หมดอายุแล้ว
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupons" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
