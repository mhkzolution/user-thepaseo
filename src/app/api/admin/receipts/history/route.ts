// app/api/admin/receipts/history/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const receipts = await prisma.receipt.findMany({
    where: { userId },
    include: { shop: true, branch: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(receipts);
}
