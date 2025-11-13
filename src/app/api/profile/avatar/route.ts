import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const name = formData.get("name") as string;

    if (!file || !name) {
      return NextResponse.json({ error: "Missing file or name" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const safeName = name.trim().toLowerCase().replace(/\s+/g, "-");
    const ext = file.type.split("/")[1] || "jpg";
    const filename = `${safeName}.${ext}`;

    const dir = path.join(process.cwd(), "public", "user", "profile");
    await mkdir(dir, { recursive: true });

    const filepath = path.join(dir, filename);
    await writeFile(filepath, buffer);
    //console.log('File saved:', filepath); // Log เพื่อตรวจสอบ

    return NextResponse.json({ filename });
  } catch (error) {
    //console.error('Error uploading avatar:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}