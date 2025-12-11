// app/api/admin/popup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ✅ ดึง popup ทั้งหมด
export async function GET(req: NextRequest) {
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
export async function PATCH(req: NextRequest) {
  return NextResponse.json(
    { error: "PATCH not allowed on /api/admin/popup" },
    { status: 405 }
  );
}
