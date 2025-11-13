// src/app/api/event/[id]/join/route.ts
import { NextResponse } from "next/server";
import { PrismaClient, PointType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

const prisma = new PrismaClient();

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authConfig);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const userId = session.user.id;

    // หา event
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        shops: true,
        branches: true,
        registrations: { where: { userId } },
        _count: { select: { registrations: true } },
      },
    });

    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const now = new Date();
    if (event.startDate > now) return NextResponse.json({ error: "อีเวนต์ยังไม่เริ่ม" }, { status: 400 });
    if (event.endDate < now) return NextResponse.json({ error: "อีเวนต์สิ้นสุดแล้ว" }, { status: 400 });

    if (event.quantity !== null && event._count.registrations >= event.quantity) {
      return NextResponse.json({ error: "อีเวนต์เต็มแล้ว" }, { status: 400 });
    }

    if (event.maxPerUser !== null && event.registrations.length >= event.maxPerUser) {
      return NextResponse.json({ error: "คุณเข้าร่วมครบจำนวนที่กำหนดแล้ว" }, { status: 400 });
    }

    // ตรวจสอบ point balance
    let pointBalance = await prisma.pointBalance.findUnique({ where: { userId } });
    if (!pointBalance) {
      const userExists = await prisma.user.findUnique({ where: { id: userId } });
      if (!userExists) return NextResponse.json({ error: "User not found" }, { status: 404 });
      pointBalance = await prisma.pointBalance.create({ data: { userId, balance: 0 } });
    }

    if (event.pointCost && pointBalance.balance < event.pointCost) {
      return NextResponse.json({ error: "แต้มไม่เพียงพอ" }, { status: 400 });
    }

    const context = {
      eventId: event.id || null,
      shopId: event.shops[0]?.id || null,
      branchId: event.branches[0]?.id || null,
    };

    // Transaction
    const registration = await prisma.$transaction(async (tx) => {
      let updatedBalance = pointBalance!.balance;

      if (event.pointCost && event.pointCost > 0) {
        updatedBalance -= event.pointCost;
        await tx.pointTransaction.create({
          data: {
            userId,
            type: PointType.REDEEM,
            referenceType: "EVENT",
            ...context,
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
            referenceType: "EVENT",
            ...context,
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

    return NextResponse.json({ message: "เข้าร่วมอีเวนต์เรียบร้อย", registration });
  } catch (error) {
    console.error("Error joining event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
