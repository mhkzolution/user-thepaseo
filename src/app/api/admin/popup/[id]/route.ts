import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const popup = await prisma.popup.findUnique({ where: { id } });
  if (!popup) return NextResponse.json({ error: "Popup not found" }, { status: 404 });
  return NextResponse.json(popup);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const updated = await prisma.popup.update({
    where: { id },
    data: body,
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.popup.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted successfully" });
}
