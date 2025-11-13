import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - ดึง popup ทั้งหมด
export async function GET() {
  try {
    const popups = await prisma.popup.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(popups);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch popups" }, { status: 500 });
  }
}

// POST - สร้าง popup ใหม่
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const popup = await prisma.popup.create({ data: body });
    return NextResponse.json(popup);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create popup" }, { status: 500 });
  }
}
