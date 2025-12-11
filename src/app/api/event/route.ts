// app/api/event/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get("shopId");

  try {
    const now = new Date();
    
    const next14Days = new Date(now);
    next14Days.setDate(now.getDate() + 14);

    const sevenDaysBefore = new Date(now);
    sevenDaysBefore.setDate(now.getDate() - 7);

    const events = await prisma.event.findMany({
      where: {
        ...(shopId ? { shops: { some: { id: shopId } } } : {}),

        OR: [
          // 1️⃣ อีเวนต์ที่ยังไม่เริ่ม แต่จะเริ่มภายใน 14 วัน
          {
            startDate: {
              gte: now,
              lte: next14Days,
            },
          },

          // 2️⃣ อีเวนต์ที่กำลังจัดอยู่
          {
            AND: [
              { startDate: { lte: now } },
              { endDate: { gte: now } },
            ],
          },

          // 3️⃣ อีเวนต์ที่เพิ่งจบภายใน 7 วัน
          {
            AND: [
              { endDate: { lt: now } },
              { endDate: { gte: sevenDaysBefore } },
            ],
          },
        ],
      },

      include: {
        branches: true,
        shops: true,
        registrations: true,
      },

      orderBy: { startDate: "asc" }, // เรียงตามวันที่เริ่ม จะได้แสดงลำดับถูกต้อง
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

