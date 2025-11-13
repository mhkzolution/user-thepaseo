// app/api/admin/popup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ✅ ดึง popup ทั้งหมด
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const popup = await prisma.popup.findMany({
      orderBy: { order: "asc" },
    });

    return NextResponse.json(popup); // ดึงทุกอัน ไม่กรอง
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch popup" },
      { status: 500 }
    );
  }
}

// ✅ สร้าง popup ใหม่
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const popup = await prisma.popup.create({
      data: {
        title: body.title,
        linkUrl: body.linkUrl,
        imageUrl: body.imageUrl,
        isActive: body.isActive ?? true,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
      },
    });

    return NextResponse.json(popup);
  } catch (error) {
    console.error("Error creating popup:", error);
    return NextResponse.json({ error: "Failed to create popup" }, { status: 500 });
  }
}

// ✅ แก้ไข popup
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const popup = await prisma.popup.update({
      where: { id },
      data: {
        title: body.title,
        linkUrl: body.linkUrl,
        imageUrl: body.imageUrl,
        isActive: body.isActive,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
      },
    });

    return NextResponse.json(popup);
  } catch (error) {
    console.error("Error updating popup:", error);
    return NextResponse.json({ error: "Failed to update popup" }, { status: 500 });
  }
}

// ✅ ลบ popup
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    await prisma.popup.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Error deleting popup:", error);
    return NextResponse.json({ error: "Failed to delete popup" }, { status: 500 });
  }
}
