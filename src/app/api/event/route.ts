// app/api/event/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get("shopId"); // ✅ รับ shopId จาก query

  try {
    const now = new Date();
    const sevenDaysAfter = new Date(now);
    sevenDaysAfter.setDate(now.getDate() - 0);

    const events = await prisma.event.findMany({
      where: {
        ...(shopId
          ? { shops: { some: { id: shopId } } } // ✅ ถ้ามี shopId ให้กรองเฉพาะร้านนั้น
          : {}),

        OR: [
          { startDate: { gte: now } }, // ยังไม่เริ่ม
          {
            AND: [
              { startDate: { lte: now } },
              { endDate: { gte: now } },
            ],
          }, // กำลังจัด
          {
            AND: [
              { endDate: { lt: now } },
              { endDate: { gte: sevenDaysAfter } },
            ],
          }, // เพิ่งจบ
        ],
      },
      include: {
        branches: true,
        shops: true,
        registrations: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = events.map((r) => ({
      ...r,
      registrations: r.registrations.length,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
