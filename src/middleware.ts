import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * JWT อยู่ใน localStorage — ห้ามบังคับ redirect ไป login ที่เลเยอร์นี้
 * (ชื่อไฟล์ middleware.ts ให้ build / deploy รุ่นเก่ารู้จัก; เนื้อหาเหมือน proxy เดิม)
 */
export function middleware(_request: NextRequest) {
  const res = NextResponse.next()
  res.headers.set("x-paseo-edge", "pass-through")
  return res
}

export const config = {
  matcher: [
    "/",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
