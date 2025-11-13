// app/api/admin/help/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ✅ ดึงข้อมูลทั้งหมด
export async function GET() {
  const helps = await prisma.help.findMany({
    orderBy: [
      { order: 'asc' },       // ✅ เรียงตามลำดับที่กำหนด
      { createdAt: 'desc' },  // fallback
    ],
  });
  return NextResponse.json(helps);
}

// ✅ เพิ่มข้อมูลใหม่
export async function POST(req: Request) {
  const data = await req.json();
  const help = await prisma.help.create({
    data: {
      question: data.question,
      answer: data.answer,
      order: data.order ?? 0,   // ✅ เพิ่ม order
      isActive: data.isActive ?? true,
    },
  });
  return NextResponse.json(help);
}


export async function PATCH(req: Request) {
  const data = await req.json();
  const help = await prisma.help.update({
    where: { id: data.id },
    data: {
      question: data.question,
      answer: data.answer,
      order: data.order ?? 0,   // ✅ เพิ่ม order
      isActive: data.isActive,
    },
  });
  return NextResponse.json(help);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.help.delete({ where: { id } });
  return NextResponse.json({ success: true });
}