import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { Workbook } from "exceljs"; // ต้องติดตั้ง exceljs: npm install exceljs

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "xlsx"; // ค่า default เป็น excel

    // ดึงข้อมูล reward ทั้งหมด
    const rewards = await prisma.reward.findMany({
      include: {
        shops: { select: { name: true } },
        branches: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    if (format === "csv") {
      // --- CSV ---
      const headers = [
        "ID",
        "Name",
        "Description",
        "Terms",
        "PointCost",
        "PointEarn",
        "Quantity",
        "MaxPerUser",
        "StartDate",
        "EndDate",
        "Shops",
        "Branches",
        "CreatedAt",
      ];

      const rows = rewards.map((r) => [
        r.id,
        r.name,
        r.description || "",
        r.terms || "",
        r.pointCost || 0,
        r.pointEarn || 0,
        r.quantity || 0,
        r.maxPerUser || 0,
        r.startDate.toISOString(),
        r.endDate.toISOString(),
        r.shops.map((s) => s.name).join(", "),
        r.branches.map((b) => b.name).join(", "),
        r.createdAt.toISOString(),
      ]);

      const csvContent =
        [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

      return new Response(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="rewards.csv"`,
        },
      });
    } else {
      // --- Excel ---
      const workbook = new Workbook();
      const sheet = workbook.addWorksheet("Rewards");

      sheet.columns = [
        { header: "ID", key: "id", width: 36 },
        { header: "Name", key: "name", width: 30 },
        { header: "Description", key: "description", width: 40 },
        { header: "Terms", key: "terms", width: 40 },
        { header: "PointCost", key: "pointCost", width: 12 },
        { header: "PointEarn", key: "pointEarn", width: 12 },
        { header: "Quantity", key: "quantity", width: 10 },
        { header: "MaxPerUser", key: "maxPerUser", width: 12 },
        { header: "StartDate", key: "startDate", width: 20 },
        { header: "EndDate", key: "endDate", width: 20 },
        { header: "Shops", key: "shops", width: 30 },
        { header: "Branches", key: "branches", width: 30 },
        { header: "CreatedAt", key: "createdAt", width: 20 },
      ];

      rewards.forEach((r) => {
        sheet.addRow({
          id: r.id,
          name: r.name,
          description: r.description || "",
          terms: r.terms || "",
          pointCost: r.pointCost || 0,
          pointEarn: r.pointEarn || 0,
          quantity: r.quantity || 0,
          maxPerUser: r.maxPerUser || 0,
          startDate: r.startDate.toISOString(),
          endDate: r.endDate.toISOString(),
          shops: r.shops.map((s) => s.name).join(", "),
          branches: r.branches.map((b) => b.name).join(", "),
          createdAt: r.createdAt.toISOString(),
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();

      return new Response(buffer, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="rewards.xlsx"`,
        },
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
