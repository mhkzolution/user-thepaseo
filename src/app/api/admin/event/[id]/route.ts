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

    const tagsRaw = formData.get("tags")?.toString() || "[]";
    const tags: string[] = JSON.parse(tagsRaw);

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

    // delete old tags
    await prisma.tagRelation.deleteMany({
      where: { targetId: id, targetType: "event" },
    });

    // add new tags
    if (tags.length > 0) {
      await prisma.tagRelation.createMany({
        data: tags.map((tagId) => ({
          tagId,
          targetId: id,
          targetType: "event",
        })),
      });
    }

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

    const tagRows = await prisma.tagRelation.findMany({
      where: {
        targetId: id,
        targetType: "event",
      },
      include: { tag: true },
    });

    const tagIds = tagRows.map(e => e.tagId);
    const tags = tagRows.map(e => e.tag);

    if (!event) {
      return NextResponse.json({ error: "event not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...event,
      tagIds,
      tags,
    });
  } catch (err: any) {
    console.error("GET event error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // หา event พร้อม relations ที่ต้องใช้ (registrations, branches, shops)
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        registrations: true,
        branches: true,
        shops: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // 1) ลบ TagRelation ของ event
    await prisma.tagRelation.deleteMany({
      where: { targetId: id, targetType: "event" },
    });

    // 2) ถ้ามี registration/participation/อื่น ๆ ที่เกี่ยวข้อง ให้ลบทิ้ง (ชื่อ model ตาม schema ของคุณ)
    // ถ้า model ของคุณชื่อแตกต่าง ให้แก้ชื่อฟังก์ชันด้านล่างให้ตรง
    await prisma.eventRegistration.deleteMany({
      where: { eventId: id },
    });

    // 3) ถอดความสัมพันธ์กับ branches / shops (optional - ป้องกัน constraint)
    await prisma.event.update({
      where: { id },
      data: {
        branches: { set: [] },
        shops: { set: [] },
      },
    });

    // 4) ลบไฟล์รูปภาพ (ถ้ามี) โดยใช้ fs/promises
    if (event.imageUrl) {
      const filePath = path.join(process.cwd(), "public", event.imageUrl);
      try {
        await fs.unlink(filePath);
      } catch (err) {
        // ถ้าไฟล์ไม่มีหรือเกิด error ในการลบ ให้ log แล้วไปต่อได้
        console.warn("Warning: failed to unlink event image", filePath, err);
      }
    }

    // 5) ลบ event จริง
    await prisma.event.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Event deleted successfully" });
  } catch (error: any) {
    console.error("❌ DELETE event error:", error);
    return NextResponse.json({ error: error.message || "Server Error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}