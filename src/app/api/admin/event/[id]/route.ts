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

    // file handling
    const file = formData.get("file") as File | null;
    let imageUrl: string | undefined = undefined;

    if (file && file.size > 0 && file.name) {
      const uploadsDir = path.join(process.cwd(), "public/uploads/admin/event");
      await fs.mkdir(uploadsDir, { recursive: true });

      const safeName = file.name.replace(/[^\w.\-_]/g, "_");
      const filename = `${Date.now()}_${safeName}`;
      const filePath = path.join(uploadsDir, filename);

      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(filePath, buffer);

      imageUrl = `/uploads/admin/event/${filename}`;
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

    if (formData.has("shopIds[]")) {
      updateData.shops = { set: shopIds.map((i) => ({ id: i })) };
    }
    if (formData.has("branchIds[]")) {
      updateData.branches = { set: branchIds.map((i) => ({ id: i })) };
    }

    const event = await prisma.event.update({
      where: { id },
      data: updateData,
      include: { shops: true, branches: true },
    });

    return NextResponse.json(event);
  } catch (err: any) {
    console.error("PATCH event error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        branches: true,
        shops: true,
        registrations: { include: { user: true } },
      },
    });
    if (!event) {
      return NextResponse.json({ error: "event not found" }, { status: 404 });
    }
    return NextResponse.json(event);
  } catch (err: any) {
    console.error("GET event error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
