import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";

const prisma = new PrismaClient();

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = await prisma.event.findUnique({
      where: { id },
      include: { registrations: true },
    });

    if (!event) {
      return NextResponse.json({ error: "ไม่พบกิจกรรม" }, { status: 404 });
    }

    // ✅ ตรวจสอบวันหมดอายุ
    if (event.endDate && new Date(event.endDate) < new Date()) {
      return NextResponse.json({ error: "กิจกรรมหมดเวลาแล้ว" }, { status: 400 });
    }

    // ✅ ตรวจสอบจำนวนสูงสุด (ใช้ quantity แทน maxRegistrations)
    if (event.quantity && event.registrations.length >= event.quantity) {
      return NextResponse.json({ error: "กิจกรรมเต็มแล้ว" }, { status: 400 });
    }

    // ✅ ตรวจสอบจำนวนต่อผู้ใช้ (maxPerUser)
    const userCount = await prisma.eventRegistration.count({
      where: {
        eventId: event.id,
        userId: session.user.id,
      },
    });

    if (event.maxPerUser && userCount >= event.maxPerUser) {
      return NextResponse.json(
        { error: `คุณเข้าร่วมครบ ${event.maxPerUser} ครั้งแล้ว` },
        { status: 400 }
      );
    }

    // ✅ ตรวจสอบว่าผู้ใช้เข้าร่วมไปแล้ว
    const exists = await prisma.eventRegistration.findFirst({
      where: {
        eventId: event.id,
        userId: session.user.id,
      },
    });

    if (exists) {
      return NextResponse.json(
        { error: "คุณได้เข้าร่วมกิจกรรมนี้แล้ว" },
        { status: 400 }
      );
    }

    // ✅ บันทึกการเข้าร่วม
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId: event.id,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ message: "เข้าร่วมสำเร็จ", registration });
  } catch (error) {
    console.error("Join error:", error);
    return NextResponse.json({ error: "Failed to join" }, { status: 500 });
  }
}
