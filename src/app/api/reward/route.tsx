// app/api/reward/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get("shopId"); // ✅ รับ shopId จาก query

  try {
    const now = new Date();
    const sevenDaysAfter = new Date(now);
    sevenDaysAfter.setDate(now.getDate() - 7); // วันที่ย้อนหลัง 7 วัน

    const rewards = await prisma.reward.findMany({
      where: {
        ...(shopId
          ? { shops: { some: { id: shopId } } } // ✅ ถ้ามี shopId ให้กรองเฉพาะร้านนั้น
          : {}),

        OR: [
          // ของรางวัลที่ยังไม่เริ่ม
          { startDate: { gte: now } },
          // ของรางวัลที่กำลังใช้งาน
          {
            AND: [
              { startDate: { lte: now } },
              { endDate: { gte: now } },
            ],
          },
          // ของรางวัลที่เพิ่งหมดอายุ (ภายใน 7 วัน)
          {
            AND: [
              { endDate: { lt: now } },
              { endDate: { gte: sevenDaysAfter } },
            ],
          },
        ],
      },
      include: {
        branches: true,
        shops: true,
        participations: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = rewards.map((r) => ({
      ...r,
      participantCount: r.participations.length,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching rewards:", error);
    return NextResponse.json(
      { error: "Failed to fetch rewards" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
