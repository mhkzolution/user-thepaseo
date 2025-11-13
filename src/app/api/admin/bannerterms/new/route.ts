import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - ดึง bannerterm ทั้งหมด
export async function GET() {
  try {
    const banner = await prisma.bannerTerms.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(banner);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch banner" }, { status: 500 });
  }
}

// POST - สร้าง bannerterm ใหม่
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const banner = await prisma.bannerTerms.create({ data: body });
    return NextResponse.json(banner);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create banner" }, { status: 500 });
  }
}
