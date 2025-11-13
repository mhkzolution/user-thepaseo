import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // ✅ ตั้งชื่อไฟล์ใหม่แบบ unique (timestamp + ชื่อไฟล์)
    const fileName = `${Date.now()}-${file.name}`;

    // ✅ กำหนดโฟลเดอร์ปลายทาง
    const uploadDir = path.join(process.cwd(), "public/uploads/admin/branches");
    const filePath = path.join(uploadDir, fileName);

    // ✅ สร้างโฟลเดอร์ถ้ายังไม่มี
    fs.mkdirSync(uploadDir, { recursive: true });

    // ✅ เขียนไฟล์ลงระบบ
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    // ✅ ส่ง path กลับให้ frontend ใช้แสดง preview หรือบันทึกใน DB
    return NextResponse.json({
      path: `/uploads/admin/branches/${fileName}`,
    });
  } catch (error) {
    console.error("❌ Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
