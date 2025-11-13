import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - ดึง bannerhome ทั้งหมด
export async function GET() {
  try {
    const banner = await prisma.bannerHome.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(banner);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch banner" }, { status: 500 });
  }
}

// POST - สร้าง bannerhome ใหม่
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const banner = await prisma.bannerHome.create({ data: body });
    return NextResponse.json(banner);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create banner" }, { status: 500 });
  }
}
