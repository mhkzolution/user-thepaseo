// app/api/admin/help/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ✅ อัพเดทข้อมูล
export async function PUT( req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();

  const help = await prisma.help.update({
    where: { id },
    data: {
      question: data.question,
      answer: data.answer,
      order: data.order ?? 0,
      isActive: data.isActive,
    },
  });

  return NextResponse.json(help);
}

// ✅ ลบข้อมูล
export async function DELETE( req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.help.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
