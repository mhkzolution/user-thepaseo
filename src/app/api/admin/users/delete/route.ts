import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const session = await getServerSession(authConfig);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { targetUserId, adminPassword } = await req.json();

  if (!targetUserId || !adminPassword) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // ✅ ดึงข้อมูล admin ที่ล็อกอินอยู่
  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!admin || !admin.password) {
    return NextResponse.json({ error: "ไม่พบข้อมูลแอดมิน" }, { status: 404 });
  }

  // ✅ ตรวจสอบรหัสผ่าน
  const isValid = await bcrypt.compare(adminPassword, admin.password);
  if (!isValid) {
    return NextResponse.json({ error: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }

  // ✅ ลบ user เป้าหมาย
  await prisma.user.delete({ where: { id: targetUserId } });

  return NextResponse.json({ success: true });
}
