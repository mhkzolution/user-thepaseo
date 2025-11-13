// app/api/admin/branches/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const branches = await prisma.branch.findMany();
  return NextResponse.json(branches);
}

export async function POST(req: Request) {
  const body = await req.json();
  const branch = await prisma.branch.create({ data: body });
  return NextResponse.json(branch);
}
