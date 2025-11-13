import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    // ✅ ดึง balance
    let balanceRecord = await prisma.pointBalance.findUnique({ where: { userId } });
    if (!balanceRecord) {
      balanceRecord = await prisma.pointBalance.create({
        data: { userId, balance: 0 },
      });
    }

    // ✅ ดึงประวัติพ้อย (รวมข้อมูลที่อ้างอิงจากกิจกรรมต่าง ๆ)
    const points = await prisma.pointTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        receipt: {
          select: {
            id: true,
            amount: true,
            status: true,
            rejectReason: true,
            shop: { select: { id: true, name: true } },
            branch: { select: { id: true, name: true } },
          },
        },
      },
    });

    // ✅ ดึงคูปองที่ user มีอยู่
    const coupons = await prisma.userCoupon.findMany({
      where: { userId },
      orderBy: { assignedAt: "desc" },
      include: {
        coupon: {
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
            imageUrl: true,
            expiresAt: true,
            shops: { select: { id: true, name: true } },      // ✅ เพิ่มตรงนี้
            branches: { select: { id: true, name: true } },  // ✅ และตรงนี้
          },
        },
      },
    });

    // ✅ รวมข้อมูลให้ frontend ใช้งานง่าย
    const formattedPoints = points.map((p) => ({
      id: p.id,
      type: p.type,
      amount: p.amount,
      balanceAfter: p.balanceAfter,
      description: p.description,
      referenceType: p.referenceType,
      createdAt: p.createdAt,
      receipt: p.receipt
        ? {
            amount: p.receipt.amount,
            status: p.receipt.status,
            rejectReason: p.receipt.rejectReason,
            shopName: p.receipt.shop?.name || "-",
            branchName: p.receipt.branch?.name || "-",
          }
        : null,
    }));

    return NextResponse.json({
      balance: balanceRecord.balance,
      points: formattedPoints,
      coupons,
    });
  } catch (error) {
    console.error("❌ Error fetching history:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
