// app/api/admin/help/reorder/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { helpOrder } = await req.json(); // [{ id, order }]
    if (!Array.isArray(helpOrder)) {
      return NextResponse.json({ error: "Invalid format" }, { status: 400 });
    }

    await prisma.$transaction(
      helpOrder.map(({ id, order }: { id: string; order: number }) =>
        prisma.help.update({ where: { id }, data: { order } })
      )
    );

    return NextResponse.json({ message: "Reordered successfully" });
  } catch (error) {
    console.error("Error reordering helps:", error);
    return NextResponse.json({ error: "Failed to reorder helps" }, { status: 500 });
  }
}
