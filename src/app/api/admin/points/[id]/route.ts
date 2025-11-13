// app/api/admin/points/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = id;

    // ✅ ดึงรายการ pointTransaction ทั้งหมดของ user
    const transactions = await prisma.pointTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        receipt: { select: { status: true } },
      },
    });

    // ✅ ดึง shop และ branch ทั้งหมดที่เกี่ยวข้องในครั้งเดียว (ลดจำนวน query)
    const shopIds = transactions.map((t) => t.shopId).filter(Boolean);
    const branchIds = transactions.map((t) => t.branchId).filter(Boolean);

    const [shops, branches] = await Promise.all([
      prisma.shop.findMany({
        where: { id: { in: shopIds as string[] } },
        select: { id: true, name: true },
      }),
      prisma.branch.findMany({
        where: { id: { in: branchIds as string[] } },
        select: { id: true, name: true },
      }),
    ]);

    // ✅ สร้าง map เพื่อจับคู่ชื่อกับ id
    const shopMap = Object.fromEntries(shops.map((s) => [s.id, s.name]));
    const branchMap = Object.fromEntries(branches.map((b) => [b.id, b.name]));

    // ✅ รวมข้อมูลชื่อเข้ากับ transaction
    const result = transactions.map((t) => ({
      ...t,
      shopName: t.shopId ? shopMap[t.shopId] || "-" : "-",
      branchName: t.branchId ? branchMap[t.branchId] || "-" : "-",
      receiptStatus: t.receipt?.status ?? null,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ Error fetching point history:", error);
    return NextResponse.json({ error: "Failed to fetch point history" }, { status: 500 });
  }
}
