import { NextResponse } from "next/server";
import { PrismaClient, ReceiptStatus, PointType, PointSource } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const session = await getServerSession(authConfig);

  // ✅ ตรวจสอบสิทธิ์แอดมิน
  if (!session || !["ADMIN", "CRMMANAGEMENT"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { receiptId, reason } = await req.json();

    if (!receiptId) {
      return NextResponse.json({ error: "Missing receiptId" }, { status: 400 });
    }

    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
      include: {
        user: { include: { pointBalance: true } },
        pointTransactions: true,
      },
    });

    if (!receipt) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    if (receipt.status === "CANCELLED") {
      return NextResponse.json({ error: "This receipt is already cancelled" }, { status: 400 });
    }

    if (receipt.status !== "APPROVED") {
      return NextResponse.json({ error: "Only approved receipts can be revoked" }, { status: 400 });
    }

    // ✅ หา transaction เดิมที่มาจาก RECEIPT
    const earnTxn = receipt.pointTransactions.find(
      (txn) => txn.amount > 0 && txn.referenceType === "RECEIPT"
    );

    if (!earnTxn) {
      return NextResponse.json({
        error: "No matching point transaction found for this receipt",
      }, { status: 400 });
    }

    const pointsToRevoke = earnTxn.amount;
    const currentBalance = receipt.user?.pointBalance?.balance ?? 0;

    // ✅ บันทึก transaction ใหม่ (ค่าลบ)
    const newTxn = await prisma.pointTransaction.create({
      data: {
        userId: receipt.userId,
        type: PointType.ADJUST,
        amount: -pointsToRevoke,
        balanceAfter: Math.max(currentBalance - pointsToRevoke, 0),

        // ✅ เพิ่มข้อมูลอ้างอิงครบชุด
        receiptId: receipt.id,
        branchId: receipt.branchId,
        shopId: receipt.shopId,
        referenceId: receipt.id,
        referenceType: PointSource.RECEIPT,
        description: reason
          ? `ยกเลิกพอยท์จากใบเสร็จ (${reason})`
          : "ยกเลิกพอยท์จากใบเสร็จโดยผู้ดูแลระบบ",
      },
    });

    // ✅ อัปเดตยอดพอยท์ของผู้ใช้
    await prisma.pointBalance.update({
      where: { userId: receipt.userId },
      data: { balance: { decrement: pointsToRevoke } },
    });

    // ✅ เปลี่ยนสถานะใบเสร็จเป็น CANCELLED
    await prisma.receipt.update({
      where: { id: receipt.id },
      data: {
        status: ReceiptStatus.CANCELLED,
        rejectReason: reason || "Revoked by admin",
      },
    });

    // ✅ Audit log สำหรับแอดมิน
    await prisma.auditLog.create({
      data: {
        adminId: session.user.id,
        action: "REVOKE_RECEIPT_POINTS",
        targetId: receipt.id,
        description: `Admin ${session.user.name} revoked ${pointsToRevoke} points for receipt ${receipt.id} (shopId: ${receipt.shopId}, branchId: ${receipt.branchId}). Reason: ${reason || "N/A"}`,
      },
    });

    return NextResponse.json({
      success: true,
      revokedPoints: pointsToRevoke,
      transaction: newTxn,
    });
  } catch (err) {
    console.error("❌ revoke-receipt error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
