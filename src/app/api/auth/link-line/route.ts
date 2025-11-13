import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

const LINE_TOKEN_URL = "https://api.line.me/oauth2/v2.1/token"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")

  if (!code || !state) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/profile?error=missing_params`)
  }

  try {
    // ✅ ดึง Access Token จาก LINE
    const tokenRes = await fetch(LINE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/link-line`,
        client_id: process.env.LINE_CLIENT_ID!,
        client_secret: process.env.LINE_CLIENT_SECRET!,
      }),
    })

    const tokenData = await tokenRes.json()
    if (!tokenData.id_token) throw new Error("LINE token fetch failed")

    // ✅ Decode id_token เพื่ออ่านข้อมูล LINE Profile
    const decoded = jwt.decode(tokenData.id_token) as any
    if (!decoded?.sub) throw new Error("Invalid LINE profile")

    const lineId = decoded.sub
    const email = decoded.email ?? `${lineId}@line.fake`
    const name = decoded.name ?? "LINE User"
    const avatar = decoded.picture ?? null

    // ✅ อัปเดตข้อมูล LINE ให้ user ที่ login อยู่ (state คือ user.id)
    await prisma.user.update({
      where: { id: state },
      data: {
        lineId,
        email,
        avatar,
        lineToken: tokenData.access_token,
        lineRefreshToken: tokenData.refresh_token,
        lineTokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
      },
    })

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/profile?success=line_connected`)
  } catch (err) {
    console.error("LINE OAuth connect failed:", err)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/profile?error=line_connect_failed`)
  }
}

export async function POST(req: Request) {
  try {
    const { idToken, userId } = await req.json()

    if (!idToken || !userId) {
      return NextResponse.json({ error: "Missing idToken or userId" }, { status: 400 })
    }

    const decoded = jwt.decode(idToken) as any
    if (!decoded?.sub) {
      return NextResponse.json({ error: "Invalid LINE token" }, { status: 400 })
    }

    const lineId = decoded.sub
    const email = decoded.email ?? `${lineId}@line.fake`
    const name = decoded.name ?? "LINE User"
    const avatar = decoded.picture ?? null

    await prisma.user.update({
      where: { id: userId },
      data: {
        lineId,
        email,
        avatar,
        lastLogin: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("LINE LIFF connect failed:", err)
    return NextResponse.json({ error: "LINE connect failed" }, { status: 500 })
  }
}
