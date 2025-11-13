// lib/getCurrentUser.ts
import { getServerSession } from "next-auth";
import { authConfig } from "./auth.config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getCurrentUser() {
  const session = await getServerSession(authConfig);
  if (!session || !session.user?.id) return null;

  return await prisma.user.findUnique({
    where: { id: session.user.id },
  });
}
