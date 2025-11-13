import { NextResponse } from "next/server";
import { PrismaClient, PointType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authConfig);
    const userId = session?.user?.id || null;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        registrations: true,
        _count: { select: { registrations: true } },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "event not found" }, { status: 404 });
    }

    const isJoined = userId
      ? event.registrations.some((p) => p.userId === userId)
      : false;

    return NextResponse.json({
      ...event,
      joinedCount: event._count.registrations,
      isJoined,
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authConfig);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const eventId = id;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        registrations: { where: { userId } },
        _count: { select: { registrations: true } },
      },
    });
    if (!event) return NextResponse.json({ error: "event not found" }, { status: 404 });

    const now = new Date();
    if (event.startDate > now) return NextResponse.json({ error: "กิจกรรมยังไม่เริ่ม" }, { status: 400 });
    if (event.endDate < now) return NextResponse.json({ error: "กิจกรรมสิ้นสุดแล้ว" }, { status: 400 });

    if (event.quantity && event._count.registrations >= event.quantity) {
      return NextResponse.json({ error: "Event เต็มแล้ว" }, { status: 400 });
    }
    if (event.maxPerUser && event.registrations.length >= event.maxPerUser) {
      return NextResponse.json({ error: "คุณเข้าร่วมครบจำนวนที่กำหนดแล้ว" }, { status: 400 });
    }

    // ดึง pointBalance
    let pointBalance = await prisma.pointBalance.findUnique({ where: { userId } });
    if (!pointBalance) {
      pointBalance = await prisma.pointBalance.create({ data: { userId, balance: 0 } });
    }

    if (event.pointCost && pointBalance.balance < event.pointCost) {
      return NextResponse.json({ error: "แต้มไม่เพียงพอ" }, { status: 400 });
    }

    // ✅ Transaction: หัก pointCost, บวก pointEarn, create registration
    const registration = await prisma.$transaction(async (tx) => {
      let updatedBalance = pointBalance!.balance;

      if (event.pointCost && event.pointCost > 0) {
        updatedBalance -= event.pointCost;
        await tx.pointTransaction.create({
          data: {
            userId,
            type: PointType.REDEEM,
            amount: -event.pointCost,
            balanceAfter: updatedBalance,
            referenceId: event.id,
            description: `Join event: ${event.name}`,
          },
        });
      }

      if (event.pointEarn && event.pointEarn > 0) {
        updatedBalance += event.pointEarn;
        await tx.pointTransaction.create({
          data: {
            userId,
            type: PointType.EARN,
            amount: event.pointEarn,
            balanceAfter: updatedBalance,
            referenceId: event.id,
            description: `Event pointEarn: ${event.name}`,
          },
        });
      }

      await tx.pointBalance.update({
        where: { userId },
        data: { balance: updatedBalance },
      });

      return tx.eventRegistration.create({
        data: { userId, eventId: event.id },
      });
    });

    return NextResponse.json({ message: "เข้าร่วมเรียบร้อย", registration });
  } catch (error) {
    console.error("❌ POST /api/event/[id] error:", error);
    return NextResponse.json({ error: "Failed to join event" }, { status: 500 });
  }
}
