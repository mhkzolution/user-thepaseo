import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

// ✅ GET: ดึง rewards ทั้งหมด
export async function GET(req: Request) {
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const pageSize = 10;

  const totalItems = await prisma.reward.count();

  const rewards = await prisma.reward.findMany({
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: { createdAt: "desc" },
    include: {
      branches: true,
      shops: true,
      participations: true,
      redemptions: true,
    },
  });

  const totalPages = Math.ceil(totalItems / pageSize);

  return NextResponse.json({
    data: rewards,
    pagination: { page, totalPages, totalItems },
  });
}

// ✅ POST: สร้าง reward ใหม่
export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const startDateRaw = formData.get("startDate")?.toString() || null;
    const endDateRaw = formData.get("endDate")?.toString() || null;

    // ข้อมูล text
    const name = formData.get("name")?.toString() || "";
    const linkShare = formData.get("linkShare")?.toString() || "";
    const description = formData.get("description")?.toString() || "";
    const terms = formData.get("terms")?.toString() || "";
    const pointCost = parseInt(formData.get("pointCost")?.toString() || "0");
    const pointEarn = parseInt(formData.get("pointEarn")?.toString() || "0");
    const quantity = parseInt(formData.get("quantity")?.toString() || "0");
    const maxPerUser = parseInt(formData.get("maxPerUser")?.toString() || "1");
    
    const startDate = startDateRaw ? new Date(startDateRaw) : new Date();
    const endDate = endDateRaw ? new Date(endDateRaw) : new Date();

    // multi-select
    const shopIds = formData.getAll("shopIds[]") as string[];
    const branchIds = formData.getAll("branchIds[]") as string[];

    // ✅ ตรวจสอบว่ามี "redemption" หรือไม่
    const isRedemption = shopIds.includes("redemption");

    // ✅ เอา shopIds ที่ไม่ใช่ redemption ไป connect
    const validShopIds = shopIds.filter((id) => id !== "redemption");

    // Handle file upload
    const file = formData.get("file") as File;
    let imageUrl: string | null = null;

    if (file && file.size > 0) {
      const uploadsDir = path.join(process.cwd(), "public/uploads/admin/reward");
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

      const filename = `${Date.now()}_${file.name}`;
      const filePath = path.join(uploadsDir, filename);

      const buffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(filePath, buffer);

      imageUrl = `/uploads/admin/reward/${filename}`;
    }

    // ✅ สร้าง reward พร้อม flag ว่าเป็น redemption หรือไม่
    const reward = await prisma.reward.create({
      data: {
        name,
        linkShare,
        description,
        terms,
        pointCost,
        pointEarn,
        quantity,
        maxPerUser,
        startDate,
        endDate,
        imageUrl,
        isRedemption,
        shops: { connect: validShopIds.map((id) => ({ id })) },
        branches: { connect: branchIds.map((id) => ({ id })) },
      },
      include: {
        shops: true,
        branches: true,
      },
    });

    return NextResponse.json(reward);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}