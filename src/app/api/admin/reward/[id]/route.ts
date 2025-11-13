import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // 👈 ต้อง await
    const formData = await req.formData();

    // อ่าน fields (อาจเป็น undefined)
    const name = formData.get("name")?.toString();
    const linkShare = formData.get("linkShare")?.toString();
    const description = formData.get("description")?.toString();
    const terms = formData.get("terms")?.toString();
    const pointCostStr = formData.get("pointCost")?.toString();
    const pointEarnStr = formData.get("pointEarn")?.toString();
    const quantityStr = formData.get("quantity")?.toString();
    const maxPerUserStr = formData.get("maxPerUser")?.toString();
    const startDateStr = formData.get("startDate")?.toString();
    const endDateStr = formData.get("endDate")?.toString();

    const shopIds = formData.getAll("shopIds[]") as string[];
    const branchIds = formData.getAll("branchIds[]") as string[];

    const isRedemption = shopIds.includes("redemption");
    const validShopIds = shopIds.filter((id) => id !== "redemption");

    // file handling
    const file = formData.get("file") as File | null;
    let imageUrl: string | undefined = undefined;

    if (file && file.size > 0 && file.name) {
      const uploadsDir = path.join(process.cwd(), "public/uploads/admin/reward");
      await fs.mkdir(uploadsDir, { recursive: true });

      const safeName = file.name.replace(/[^\w.\-_]/g, "_");
      const filename = `${Date.now()}_${safeName}`;
      const filePath = path.join(uploadsDir, filename);

      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(filePath, buffer);

      imageUrl = `/uploads/admin/reward/${filename}`;
    }

    // build update object
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (linkShare !== undefined) updateData.linkShare = linkShare;
    if (description !== undefined) updateData.description = description;
    if (terms !== undefined) updateData.terms = terms;
    if (pointCostStr !== undefined) updateData.pointCost = parseInt(pointCostStr || "0", 10);
    if (pointEarnStr !== undefined) updateData.pointEarn = parseInt(pointEarnStr || "0", 10);
    if (quantityStr !== undefined) updateData.quantity = parseInt(quantityStr || "0", 10);
    if (maxPerUserStr !== undefined) updateData.maxPerUser = parseInt(maxPerUserStr || "0", 10);
    if (startDateStr) updateData.startDate = new Date(startDateStr);
    if (endDateStr) updateData.endDate = new Date(endDateStr);
    if (imageUrl) updateData.imageUrl = imageUrl;

    updateData.isRedemption = isRedemption;

    if (formData.has("shopIds[]")) {
      updateData.shops = { set: validShopIds.map((id) => ({ id })) };
    }
    if (formData.has("branchIds[]")) {
      updateData.branches = { set: branchIds.map((id) => ({ id })) };
    }

    const reward = await prisma.reward.update({
      where: { id },
      data: updateData,
      include: { shops: true, branches: true },
    });

    return NextResponse.json(reward);
  } catch (err: any) {
    console.error("PATCH reward error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const reward = await prisma.reward.findUnique({
      where: { id },
      include: {
        branches: true,
        shops: true,
        participations: { include: { user: true } },
        redemptions: { include: { user: true } },
      },
    });

    if (!reward) {
      return NextResponse.json({ error: "Reward not found" }, { status: 404 });
    }

    // ✅ เตรียม label แสดงผล
    let locationLabel = "ไม่ระบุ";
    if (reward.isRedemption) {
      locationLabel = "🎁 จุดบริการ (Redemption)";
    } else if (reward.shops.length > 0) {
      const shopNames = reward.shops.map((s) => s.name).join(", ");
      locationLabel = `ร้านค้า: ${shopNames}`;
    } else if (reward.branches.length > 0) {
      const branchNames = reward.branches.map((b) => b.name).join(", ");
      locationLabel = `สาขา: ${branchNames}`;
    }

    // ✅ เพิ่ม field ใหม่เพื่อให้ frontend ใช้งานง่าย
    const shopIds = reward.isRedemption
      ? ["redemption"]
      : reward.shops.map((s) => s.id);

    const branchIds = reward.branches.map((b) => b.id);

    return NextResponse.json({
      ...reward,
      shopIds,     // ✅ ใช้แทน selectedShops ในหน้าแก้ไข
      branchIds,   // ✅ ใช้แทน selectedBranches
      locationLabel,
      linkShare: reward.linkShare || "",
    });
  } catch (err: any) {
    console.error("GET reward error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

