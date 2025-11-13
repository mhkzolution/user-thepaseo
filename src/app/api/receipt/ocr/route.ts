// src/app/api/receipt/ocr/route.ts
// import vision from "@google-cloud/vision";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { imageBase64 } = await req.json();

  // const client = new vision.ImageAnnotatorClient({
  //   keyFilename: "google-key.json", // ใส่ไฟล์ service account
  // });

  // const [result] = await client.textDetection({
  //   image: { content: Buffer.from(imageBase64, "base64") },
  // });

  // const detections = result.textAnnotations;
  // const text = detections?.[0]?.description || "";

  // const match = text.match(/\d{1,6}\.\d{2}/);
  // return NextResponse.json({ text, amount: match ? match[0] : null });
}
