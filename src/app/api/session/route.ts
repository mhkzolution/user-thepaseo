// /app/api/session/route.ts

import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await getServerSession(authConfig)
  console.log("API SESSION:", session)
  return NextResponse.json({ session })
}
