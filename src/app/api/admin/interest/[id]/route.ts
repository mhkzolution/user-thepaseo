import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// PUT update interest
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { name } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const interest = await prisma.interest.update({
      where: { id },
      data: { name },
    });

    return NextResponse.json(interest);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update interest" }, { status: 500 });
  }
}

// DELETE remove interest
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.interest.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete interest" }, { status: 500 });
  }
}
