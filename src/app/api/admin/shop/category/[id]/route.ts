// app/api/admin/shop/category/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await prisma.shopCategory.findUnique({
    where: { id },
  });
  return NextResponse.json(category);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const category = await prisma.shopCategory.update({
    where: { id },
    data: body,
  });
  return NextResponse.json(category);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.shopCategory.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
