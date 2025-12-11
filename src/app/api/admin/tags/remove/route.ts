import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { tagId, targetId, targetType } = await req.json();

  await prisma.tagRelation.deleteMany({
    where: { tagId, targetId, targetType },
  });

  return NextResponse.json({ message: "removed" });
}
