import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

// ✅ GET: ดึง campaigns ทั้งหมด
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          branches: true,
          shops: true,
          coupons: {
            select: { id: true, name: true, code: true, expiresAt: true },
          },
          _count: { select: { participations: true } },
        },
      }),
      prisma.campaign.count(),
    ]);

    return NextResponse.json({
      data: campaigns,
      pagination: {
        page,
        totalPages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching campaigns:", error);
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// ✅ POST: สร้าง campaign ใหม่ (ไม่มีการสร้าง coupon แล้ว)
export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const name = formData.get("name")?.toString() || "";
    const linkShare = formData.get("linkShare")?.toString() || "";
    const code = formData.get("code")?.toString() || null;
    const description = formData.get("description")?.toString() || "";
    const terms = formData.get("terms")?.toString() || "";
    const pointCost = parseInt(formData.get("pointCost")?.toString() || "0");
    const pointEarn = parseInt(formData.get("pointEarn")?.toString() || "0");
    const quantity = parseInt(formData.get("quantity")?.toString() || "0");
    const maxPerUser = parseInt(formData.get("maxPerUser")?.toString() || "1");

    const startDateRaw = formData.get("startDate")?.toString() || "";
    const endDateRaw = formData.get("endDate")?.toString() || "";
    const startDate = startDateRaw ? new Date(startDateRaw) : null;
    const endDate = endDateRaw ? new Date(endDateRaw) : null;

    const shopIds = formData.getAll("shopIds[]") as string[];
    const branchIds = formData.getAll("branchIds[]") as string[];

    // ✅ Handle file upload
    const file = formData.get("file") as File;
    let imageUrl: string | null = null;

    if (file && file.size > 0) {
      const uploadsDir = path.join(process.cwd(), "public/uploads/admin/campaign");
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

      const filename = `${Date.now()}_${file.name}`;
      const filePath = path.join(uploadsDir, filename);
      const buffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(filePath, buffer);
      imageUrl = `/uploads/admin/campaign/${filename}`;
    }

    // ✅ Create Campaign
    const campaign = await prisma.campaign.create({
      data: {
        code,
        name,
        linkShare,
        description,
        terms,
        pointCost,
        pointEarn,
        quantity,
        maxPerUser,
        startDate: startDate || new Date(),
        endDate: endDate || new Date(),
        imageUrl,
        shops: { connect: shopIds.map((id) => ({ id })) },
        branches: { connect: branchIds.map((id) => ({ id })) },
      },
      include: {
        shops: true,
        branches: true,
      },
    });

    return NextResponse.json({ campaign });
  } catch (error: any) {
    console.error("❌ Error creating campaign:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// ✅ DELETE: ลบ Campaign (พร้อมลบ relations ที่เกี่ยวข้อง)
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: { coupons: true },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // ✅ Step 1: ลบ participation / relation ก่อน
    await prisma.campaignParticipation.deleteMany({ where: { campaignId: id } });

    // ✅ Step 2: ถ้ามี image → ลบออก
    if (campaign.imageUrl) {
      const filePath = path.join(process.cwd(), "public", campaign.imageUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    // ✅ Step 3: ลบ Campaign
    await prisma.campaign.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Campaign deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting campaign:", error);
    return NextResponse.json({ error: "Failed to delete campaign" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
