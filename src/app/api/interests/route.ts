// app/api/interests/route.ts
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  const interests = await prisma.interest.findMany();
  return NextResponse.json(interests);
}
