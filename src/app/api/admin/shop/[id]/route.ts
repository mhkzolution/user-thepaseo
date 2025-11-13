import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ✅ GET single shop
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const shop = await prisma.shop.findUnique({
      where: { id },
      include: { category: true, branch: true },
    });
    return NextResponse.json(shop);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch shop" }, { status: 500 });
  }
}

// ✅ UPDATE
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const shop = await prisma.shop.update({
      where: { id },
      data: body,
    });
    return NextResponse.json(shop);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update shop" }, { status: 500 });
  }
}

// ✅ DELETE
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.shop.delete({ where: { id } });
    return NextResponse.json({ message: "Shop deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete shop" }, { status: 500 });
  }
}
