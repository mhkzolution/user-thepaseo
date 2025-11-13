//api/receipts/shop/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

const prisma = new PrismaClient();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: Request) {
  try {
    // ✅ ตรวจสอบว่าเป็น admin
    const session = await getServerSession(authConfig);
    if (!session) {
      return NextResponse.json({ error: "No session found. Please login." }, { status: 403 });
    }
    
    const allowedRoles = ["ADMIN", "ADMINMARKETING", "CRMMANAGEMENT", "STAFF"];
    if (!allowedRoles.includes(session.user.role ?? "")) {
      return NextResponse.json(
        { error: `Unauthorized: User role '${session.user.role ?? "UNKNOWN"}' is not allowed` },
        { status: 403 }
      );
    }

    // ✅ ดึงร้านค้าและสาขา
    const shops = await prisma.shop.findMany({
      select: {
        id: true,
        name: true,
        branch: {  // ✅ เปลี่ยนจาก branches เป็น branch
          select: { id: true, name: true },
        },
      },
      orderBy: { name: "asc" },
    });

    // ✅ Normalize ข้อมูลให้เหมาะกับ dropdown
    const normalized = shops.map((shop) => ({
      shopId: shop.id,
      shopName: shop.name,
      branchId: shop.branch?.id || "",
      branchName: shop.branch?.name || "สาขาหลัก",
      id: `${shop.id}__${shop.branch?.id || "main"}`,
    }));

    if (normalized.length === 0) {
      return NextResponse.json({ error: "No shops found in database" }, { status: 404 });
    }

    return NextResponse.json(normalized);
  } catch (error: any) {
    console.error("GET admin receipts/shop error:", error.message, error.stack);
    return NextResponse.json({ error: `Failed to fetch shops: ${error.message}` }, { status: 500 });
  }
}