import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { tagId, targetId, targetType } = await req.json();

  if (!tagId || !targetId || !targetType) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const link = await prisma.tagRelation.create({
    data: { tagId, targetId, targetType },
  });

  return NextResponse.json(link);
}
