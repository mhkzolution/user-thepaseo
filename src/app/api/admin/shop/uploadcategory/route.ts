// app/api/admin/shop/uploadcategory/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file)
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

  // ตั้งชื่อไฟล์ใหม่โดยใช้ timestamp กันซ้ำ
  const fileName = `${Date.now()}-${file.name}`;

  // ✅ เก็บไว้ในโฟลเดอร์หมวดหมู่ร้านค้าโดยเฉพาะ
  const uploadDir = path.join(process.cwd(), "public/uploads/admin/shop/category");
  const filePath = path.join(uploadDir, fileName);

  // สร้างโฟลเดอร์ถ้ายังไม่มี
  fs.mkdirSync(uploadDir, { recursive: true });

  // เขียนไฟล์ลงในโฟลเดอร์
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filePath, buffer);

  // ✅ ส่ง path กลับไปให้ frontend ใช้
  return NextResponse.json({ path: `/uploads/admin/shop/category/${fileName}` });
}
