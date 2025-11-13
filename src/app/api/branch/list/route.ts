import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  const branches = await prisma.branch.findMany({
    select: { id: true, name: true }
  });
  return NextResponse.json(branches);
}
