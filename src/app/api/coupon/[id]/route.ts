//api/coupon/[id]/use
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, PointType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

/* ============================================================
   ✅ GET /api/coupon/[id]
   สำหรับฝั่ง User ใช้ตรวจสอบสถานะคูปอง
============================================================ */
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authConfig);
    const userId = session?.user?.id || null;

    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        shops: true,
        branches: true,
        campaign: true,
        _count: { select: { users: true } },
      },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    const now = new Date();

    // ✅ สถานะคูปอง
    const isExpired = coupon.endDate ? coupon.endDate < now : false;
    const isFull =
      coupon.quantity !== null && coupon._count.users >= coupon.quantity;

    // ✅ แต้มของ user
    let pointBalance = 0;
    if (userId) {
      const pointRecord = await prisma.pointBalance.findUnique({ where: { userId } });
      pointBalance = pointRecord?.balance ?? 0;
    }

    // ✅ เช็คจำนวนครั้งที่ user เคยรับคูปองนี้
    let receivedCount = 0;
    if (userId) {
      receivedCount = await prisma.userCoupon.count({
        where: { userId, couponId: coupon.id },
      });
    }

    // ✅ เช็คว่ารับไปครบจำนวนต่อคนหรือยัง
    const maxPerUser = coupon.maxPerUser ?? 1;
    const isReceived = receivedCount >= maxPerUser;

        // ---- Label แสดงสถานที่ ----
    let locationLabel = "ไม่ระบุ";
    if (coupon.isRedemption) {
      locationLabel = "🎁 จุดบริการ (Redemption)";
    } else if (coupon.shops.length > 0) {
      locationLabel = `ร้านค้า: ${coupon.shops.map((s) => s.name).join(", ")}`;
    } else if (coupon.branches.length > 0) {
      locationLabel = `สาขา: ${coupon.branches.map((b) => b.name).join(", ")}`;
    }

    // ✅ เช็คสิทธิ์ว่ารับได้ไหม
    const canReceive =
      !isExpired &&
      !isFull &&
      !isReceived &&
      pointBalance >= (coupon.pointCost ?? 0);

    return NextResponse.json({
      id: coupon.id,
      name: coupon.name,
      description: coupon.description,
      terms: coupon.terms,
      imageUrl: coupon.imageUrl,
      pointCost: coupon.pointCost || 0,
      pointEarn: coupon.pointEarn || 0,
      quantity: coupon.quantity || null,
      maxPerUser: coupon.maxPerUser || null,
      receivedCount,
      totalReceived: coupon._count.users,
      startDate: coupon.startDate,
      endDate: coupon.endDate,
      isExpired,
      isFull,
      isReceived,
      canReceive,
      pointBalance,
      campaign: coupon.campaign,
      locationLabel,
    });
  } catch (error) {
    console.error("❌ GET /api/coupon/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ============================================================
   ✅ POST /api/coupon/[id]
   สำหรับ “รับคูปอง” โดยหักแต้มและเพิ่มคูปองให้ user
============================================================ */
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {

  function generateRedeemCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
  try {
    const { id } = await context.params;
    const session = await getServerSession(authConfig);
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const couponId = id; // ✅ แก้ตรงนี้

    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
      include: {
        shops: true,
        branches: true,
        _count: { select: { users: true } },
      },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    const now = new Date();
    if (coupon.startDate && coupon.startDate > now)
      return NextResponse.json({ error: "คูปองนี้ยังไม่เริ่มแจก" }, { status: 400 });
    if (coupon.endDate && coupon.endDate < now)
      return NextResponse.json({ error: "คูปองนี้หมดอายุแล้ว" }, { status: 400 });

    // ✅ ตรวจสอบจำนวนรวม
    if (
      coupon.quantity !== null &&
      coupon._count.users >= coupon.quantity
    ) {
      return NextResponse.json({ error: "คูปองนี้หมดแล้ว" }, { status: 400 });
    }

    // ✅ ตรวจสอบจำนวนต่อ user
    const receivedCount = await prisma.userCoupon.count({
      where: { userId, couponId },
    });
    if (coupon.maxPerUser && receivedCount >= coupon.maxPerUser) {
      return NextResponse.json({ error: "คุณรับคูปองนี้ครบจำนวนที่กำหนดแล้ว" }, { status: 400 });
    }

    // ✅ ตรวจสอบแต้ม
    let balanceRecord = await prisma.pointBalance.findUnique({ where: { userId } });
    if (!balanceRecord) {
      balanceRecord = await prisma.pointBalance.create({ data: { userId, balance: 0 } });
    }
    if (coupon.pointCost && balanceRecord.balance < coupon.pointCost) {
      return NextResponse.json({ error: "แต้มไม่เพียงพอ" }, { status: 400 });
    }

    // ✅ Transaction: หักแต้ม + เพิ่มแต้ม (ถ้ามี) + สร้าง userCoupon
    const result = await prisma.$transaction(async (tx) => {
      let updatedBalance = balanceRecord!.balance;

      if (coupon.pointCost && coupon.pointCost > 0) {
        updatedBalance -= coupon.pointCost;
        await tx.pointTransaction.create({
          data: {
            userId,
            type: PointType.REDEEM,
            referenceType: "COUPON",
            referenceId: coupon.id,
            amount: -coupon.pointCost,
            balanceAfter: updatedBalance,
            description: `ใช้แต้มเพื่อรับคูปอง: ${coupon.name}`,
          },
        });
      }

      if (coupon.pointEarn && coupon.pointEarn > 0) {
        updatedBalance += coupon.pointEarn;
        await tx.pointTransaction.create({
          data: {
            userId,
            type: PointType.EARN,
            referenceType: "COUPON",
            referenceId: coupon.id,
            amount: coupon.pointEarn,
            balanceAfter: updatedBalance,
            description: `ได้รับแต้มจากคูปอง: ${coupon.name}`,
          },
        });
      }

      await tx.pointBalance.update({
        where: { userId },
        data: { balance: updatedBalance },
      });

      const redeemCode = generateRedeemCode();

      const userCoupon = await tx.userCoupon.create({
        data: { 
          userId, 
          couponId, 
          redeemCode
        },
      });

      // ลดจำนวนคูปองคงเหลือ
      if (coupon.quantity && coupon.quantity > 0) {
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { quantity: { decrement: 1 } },
        });
      }

      return { userCoupon, updatedBalance };
    });

    return NextResponse.json({
  message: "🎉 รับคูปองสำเร็จ!",
  userCoupon: result.userCoupon,
  balanceAfter: result.updatedBalance,
});
  } catch (error) {
    console.error("❌ POST /api/coupon/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/* ============================================================
   ✅ PUT /api/coupon/[id]
   ใช้แก้ไขข้อมูลคูปอง (ฝั่ง admin)
============================================================ */
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const formData = await req.formData();

    const startDateRaw = formData.get("startDate")?.toString() || "";
    const endDateRaw = formData.get("endDate")?.toString() || "";

    const code = formData.get("code")?.toString() || "";
    const name = formData.get("name")?.toString() || "";
    const description = formData.get("description")?.toString() || "";
    const terms = formData.get("terms")?.toString() || "";
    const pointCost = parseInt(formData.get("pointCost")?.toString() || "0");
    const pointEarn = parseInt(formData.get("pointEarn")?.toString() || "0");
    const quantity = parseInt(formData.get("quantity")?.toString() || "0");
    const maxPerUser = parseInt(formData.get("maxPerUser")?.toString() || "1");
    const campaignId = formData.get("campaignId")?.toString() || null;
    const autoAssign = formData.get("autoAssign") === "true";

    const startDate = startDateRaw ? new Date(startDateRaw) : null;
    const endDate = endDateRaw ? new Date(endDateRaw) : null;

    // ✅ handle file upload (อัปเดตรูปใหม่ถ้ามี)
    const file = formData.get("file") as File;
    let imageUrl: string | null = null;
    if (file && file.size > 0) {
      const uploadsDir = path.join(process.cwd(), "public/uploads/admin/coupon");
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

      const filename = `${Date.now()}_${file.name}`;
      const filePath = path.join(uploadsDir, filename);
      const buffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(filePath, buffer);
      imageUrl = `/uploads/admin/coupon/${filename}`;
    }

    const updated = await prisma.coupon.update({
      where: { id },
      data: {
        code,
        name,
        description,
        terms,
        pointCost,
        pointEarn,
        quantity,
        maxPerUser,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        campaignId,
        autoAssign,
        ...(imageUrl ? { imageUrl } : {}),
      },
      include: {
        campaign: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("❌ PUT /api/coupon/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
