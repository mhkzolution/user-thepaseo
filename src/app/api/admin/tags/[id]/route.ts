import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Update tag
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { name } = await req.json();

    const tag = await prisma.tag.update({
      where: { id },
      data: { name },
    });

    return NextResponse.json(tag);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update tag" }, { status: 500 });
  }
}

// Delete tag
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Remove tag relations
    await prisma.tagRelation.deleteMany({
      where: { tagId: id },
    });

    // Remove tag
    await prisma.tag.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Tag deleted" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete tag" }, { status: 500 });
  }
}
