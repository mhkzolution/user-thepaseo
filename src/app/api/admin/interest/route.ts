import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET all interests
export async function GET() {
  try {
    const interests = await prisma.interest.findMany();
    return NextResponse.json(interests); // คาดหวัง [{ id: string, name: string }, ...]
  } catch (error) {
    console.error("Error fetching interests:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงความสนใจ" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// POST create new interest
export async function POST(req: Request) {
  try {
    const { name } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const interest = await prisma.interest.create({
      data: { name },
    });
    return NextResponse.json(interest);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create interest" }, { status: 500 });
  }
}
