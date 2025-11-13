// app/api/admin/shop/category/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const categories = await prisma.shopCategory.findMany({
    include: { shops: true },
  });
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const body = await req.json();
  const category = await prisma.shopCategory.create({ data: body });
  return NextResponse.json(category);
}
