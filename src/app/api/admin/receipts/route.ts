//api/admin/receipts/
import { NextResponse } from "next/server";
import { PrismaClient, PointType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

import { sendLinePointCard } from "@/lib/lineNotify";

const prisma = new PrismaClient();

// ✅ GET: ดึงใบเสร็จที่รออนุมัติ
export async function GET() {
  const receipts = await prisma.receipt.findMany({
    where: { status: "PENDING" },
    include: { user: true, shop: true, branch: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(receipts);
}

// ✅ PATCH: อัปเดตสถานะใบเสร็จ (อนุมัติ / ปฏิเสธ)
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id, status, rejectReason, amount, shopId, branchId } = await req.json();
    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const reviewedById = session.user.id;

    const receipt = await prisma.receipt.update({
      where: { id },
      data: {
        status,
        reviewedBy: reviewedById,
        reviewedAt: new Date(),
        ...(status === "REJECTED" ? { rejectReason } : { rejectReason: null }),
        ...(amount ? { amount } : {}),
        ...(shopId ? { shopId } : {}),
        ...(branchId ? { branchId } : {}),
      },
      include: { user: true, shop: true, branch: true },
    });

    // ✅ ถ้าอนุมัติ → คำนวณพอยท์และบันทึก
    if (status === "APPROVED" && receipt.user) {
      const setting = await prisma.pointSetting.findFirst();
      if (!setting) {
        return NextResponse.json({ error: "Point setting not found" }, { status: 500 });
      }

      const pointsToAdd =
        Math.floor(receipt.amount / setting.receiptRateAmount) * setting.receiptRatePoints;

      // ✅ ตรวจสอบหรือสร้าง PointBalance
      let pointBalance = await prisma.pointBalance.findUnique({
        where: { userId: receipt.userId },
      });
      if (!pointBalance) {
        pointBalance = await prisma.pointBalance.create({
          data: { userId: receipt.userId, balance: 0 },
        });
      }

      const updatedBalance = pointBalance.balance + pointsToAdd;

      // ✅ Transaction — อัปเดตแต้มและสร้าง log
      await prisma.$transaction(async (tx) => {
        // update user
        await tx.user.update({
          where: { id: receipt.userId },
          data: {
            totalSpending: { increment: receipt.amount },
          },
        });

        // update balance
        await tx.pointBalance.update({
          where: { userId: receipt.userId },
          data: { balance: updatedBalance },
        });

        // log transaction
        await tx.pointTransaction.create({
          data: {
            userId: receipt.userId,
            type: PointType.RECEIPT,
            referenceType: "RECEIPT",
            amount: pointsToAdd,
            balanceAfter: updatedBalance,
            referenceId: receipt.id,
            receiptId: receipt.id,
            shopId: receipt.shopId,
            branchId: receipt.branchId,
            description: "พอยท์จากการส่งใบเสร็จ",
          },
        });
      });

      // ✅ แจ้งเตือน LINE เฉพาะตอน “ได้รับแต้ม”
      await sendLinePointCard(receipt.userId, {
        type: "ADD",
        amount: pointsToAdd,
        source: `ใบเสร็จร้าน ${receipt.shop?.name || ""}`,
        balance: updatedBalance,
      });
    }

    return NextResponse.json({ success: true, receipt });
  } catch (error) {
    console.error("❌ PATCH receipts error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ✅ POST: Admin เพิ่มใบเสร็จและอนุมัติทันที
export async function POST(req: Request) {
  const session = await getServerSession(authConfig);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;
    const amount = parseInt(formData.get("amount") as string, 10);
    const branchId = formData.get("branchId") as string;
    const shopId = formData.get("shopId") as string;

    if (!userId || !amount || !branchId || !shopId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // ✅ Upload file
    let fileUrl: string | null = null;
    let fileType: "IMAGE" | "PDF" | null = null;

    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = path.join(process.cwd(), "public/uploads/admin/receipts", fileName);
      await mkdir(path.dirname(filePath), { recursive: true });
      await writeFile(filePath, buffer);

      fileUrl = `/uploads/admin/receipts/${fileName}`;
      fileType = file.type.startsWith("image/") ? "IMAGE" : "PDF";
    }

    const reviewedById = session.user.id;

    // ✅ สร้างใบเสร็จ (สถานะ APPROVED)
    const receipt = await prisma.receipt.create({
      data: {
        userId,
        amount,
        reviewedAt: new Date(),
        status: "APPROVED",
        reviewedBy: reviewedById,
        branchId,
        shopId,
        ...(fileUrl && { fileUrl }),
        ...(fileType && { fileType }),
      },
      include: { shop: true, branch: true },
    });

    // ✅ คำนวณแต้ม
    const setting = await prisma.pointSetting.findFirst();
    if (!setting) {
      return NextResponse.json({ error: "Point setting not found" }, { status: 500 });
    }

    const pointsToAdd =
      Math.floor(receipt.amount / setting.receiptRateAmount) * setting.receiptRatePoints;

    // ✅ Point Balance & Transaction
    let pointBalance = await prisma.pointBalance.findUnique({ where: { userId } });
    if (!pointBalance) {
      pointBalance = await prisma.pointBalance.create({ data: { userId, balance: 0 } });
    }

    const updatedBalance = pointBalance.balance + pointsToAdd;

    await prisma.$transaction(async (tx) => {
      await tx.pointBalance.update({
        where: { userId },
        data: { balance: updatedBalance },
      });

      await tx.pointTransaction.create({
        data: {
          userId,
          type: PointType.RECEIPT,
          referenceType: "RECEIPT",
          amount: pointsToAdd,
          balanceAfter: updatedBalance,
          referenceId: receipt.id,
          receiptId: receipt.id,
          shopId,
          branchId,
          description: "พอยท์จากการส่งใบเสร็จ",
        },
      });
    });

    // ✅ แจ้งเตือน LINE เมื่อได้รับแต้ม (Admin แอดให้)
    await sendLinePointCard(userId, {
      type: "ADD",
      amount: pointsToAdd,
      source: `ใบเสร็จร้าน ${receipt.shop?.name || ""}`,
      balance: updatedBalance,
    });

    return NextResponse.json({ success: true, receipt });
  } catch (error) {
    console.error("❌ POST admin receipts error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
