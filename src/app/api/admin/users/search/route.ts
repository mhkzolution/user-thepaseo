// api/admin/users/search/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const session = await getServerSession(authConfig);
      if (!session) {
        return NextResponse.json({ error: "No session found. Please login." }, { status: 403 });
      }
      
      const allowedRoles = ["ADMIN", "ADMINMARKETING", "CRMMANAGEMENT", "STAFF"];
      if (!allowedRoles.includes(session.user.role)) {
        return NextResponse.json(
          { error: `Unauthorized: User role '${session.user.role}' is not allowed` },
          { status: 403 }
        );
      }

  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone");
  const email = searchParams.get("email");

  if (!phone && !email) {
    return NextResponse.json({ error: "Missing phone or email" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        phone ? { phone } : undefined,
        email ? { email } : undefined,
      ].filter(Boolean) as any,
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const pointBalance = await prisma.pointBalance.findUnique({
    where: { userId: user.id },
  });

  return NextResponse.json({
    ...user,
    pointBalance: pointBalance?.balance || 0,
  });
}