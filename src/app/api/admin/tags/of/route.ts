import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const targetId = searchParams.get("targetId");
  const targetType = searchParams.get("targetType");

  if (!targetId || !targetType) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const rows = await prisma.tagRelation.findMany({
    where: { targetId, targetType },
    include: { tag: true },
  });

  const tags = rows.map((r) => r.tag);

  return NextResponse.json(tags);
}
