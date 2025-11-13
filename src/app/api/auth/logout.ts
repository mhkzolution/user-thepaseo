// /app/api/auth/logout/route.ts
import { NextResponse } from 'next/server'

export async function POST() {
  const res = NextResponse.json({ message: 'Logged out' })
  res.cookies.set('next-auth.session-token', '', {
    httpOnly: true,
    path: '/',
    expires: new Date(0),
  })
  return res
}